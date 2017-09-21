#version 300 es

precision mediump float;

{% include "./uniforms.njk.frag" %}

{% include "./color.njk.frag" %}

{% include "./raytrace.njk.frag" %}

const int ID_PRISM = 0;
const int ID_INI_SPHERES = 1;

vec4 distFunc(const vec3 pos) {
    vec4 hit = vec4(MAX_FLOAT, -1, -1, -1);
    hit = DistUnion(hit, vec4(DistSpheirahedra(pos + u_boundingSphere.center), ID_PRISM, -1, -1));
    return hit;
}

const vec2 NORMAL_COEFF = vec2(0.00001, 0.);
vec3 computeNormal(const vec3 p) {
    return normalize(vec3(distFunc(p + NORMAL_COEFF.xyy).x - distFunc(p - NORMAL_COEFF.xyy).x,
                          distFunc(p + NORMAL_COEFF.yxy).x - distFunc(p - NORMAL_COEFF.yxy).x,
                          distFunc(p + NORMAL_COEFF.yyx).x - distFunc(p - NORMAL_COEFF.yyx).x));
}

const int MAX_MARCHING_LOOP = 3000;
const float MARCHING_THRESHOLD = 0.001;
void march(const vec3 rayOrg, const vec3 rayDir,
           inout IsectInfo isectInfo) {
    float rayLength = 0.;
    vec3 rayPos = rayOrg + rayDir * rayLength;
    vec4 dist = vec4(-1);
    for(int i = 0 ; i < MAX_MARCHING_LOOP ; i++) {
        if(rayLength > isectInfo.maxt ||
           rayLength > isectInfo.mint) break;
        dist = distFunc(rayPos);
        rayLength += dist.x;
        rayPos = rayOrg + rayDir * rayLength;
        if(dist.x < MARCHING_THRESHOLD) {
            isectInfo.objId = int(dist.y);
            //isectInfo.objIndex = int(dist.z);
            //isectInfo.objComponentId = int(dist.w);
            isectInfo.matColor = vec3(0.7);
            isectInfo.intersection = rayPos;
            isectInfo.normal = computeNormal(rayPos);
            isectInfo.mint = rayLength;
            isectInfo.hit = true;
            break;
        }
    }
}

const vec3 AMBIENT_FACTOR = vec3(0.1);
const vec3 LIGHT_DIR = normalize(vec3(1, 1, 0));
vec3 computeColor(const vec3 rayOrg, const vec3 rayDir) {
    IsectInfo isectInfo = NewIsectInfo();
    vec3 rayPos = rayOrg;

    vec3 l = vec3(0);

    float transparency = 0.8;
    float coeff = 1.;
    for(int depth = 0 ; depth < 8; depth++){
        march(rayPos, rayDir, isectInfo);
		if (u_displaySpheirahedraSphere) {
			{% for n in range(0, numSpheirahedraSpheres) %}
			IntersectSphere(ID_INI_SPHERES, {{ n }}, -1,
							Hsv2rgb(float({{ n }}) * 0.3, 1., 1.),
							u_spheirahedraSpheres[{{ n }}].center - u_boundingSphere.center,
							u_spheirahedraSpheres[{{ n }}].r.x*1.00001,
							rayPos, rayDir, isectInfo);
			{% endfor %}
		}
		if (u_displayConvexSphere) {
            {% for n in range(0, numDividePlanes) %}
			IntersectSphere(ID_INI_SPHERES, -1, -1,
							vec3(0.7), u_convexSpheres[{{ n }}].center - u_boundingSphere.center,
							u_convexSpheres[{{ n }}].r.x,
							rayPos, rayDir, isectInfo);
            {% endfor %}
		}

		if (u_displayInversionSphere) {
			IntersectSphere(ID_INI_SPHERES, -1, -1,
							vec3(0.7),
							u_inversionSphere.center - u_boundingSphere.center,
							u_inversionSphere.r.x,
							rayPos, rayDir, isectInfo);
		}

        if(isectInfo.hit) {
            vec3 matColor = isectInfo.matColor;
            vec3 diffuse =  clamp(dot(isectInfo.normal, LIGHT_DIR), 0., 1.) * matColor;
            vec3 ambient = matColor * AMBIENT_FACTOR;
            bool transparent = false;
            transparent =  (isectInfo.objId == ID_INI_SPHERES) ?
                true : false;

            if(transparent) {
                coeff *= transparency;
                l += (diffuse + ambient) * coeff;
                rayPos = isectInfo.intersection + rayDir * 0.000001 * 2.;
                isectInfo = NewIsectInfo();
                continue;
            } else {
                l += (diffuse + ambient) * coeff;
            }
        }
        break;
    }

    return l;
}

out vec4 outColor;
void main() {
    vec3 sum = vec3(0);
    float MAX_SAMPLES = 5.;
    for (float i = 0. ; i < MAX_SAMPLES ; i++) {
        vec2 coordOffset = Rand2n(gl_FragCoord.xy, i);
        vec3 ray = CalcRay(u_camera.pos, u_camera.target, u_camera.up, u_camera.fov,
                           u_resolution, gl_FragCoord.xy + coordOffset);
        sum += computeColor(u_camera.pos, ray);
    }
    outColor = vec4(sum / MAX_SAMPLES, 1.0);
}
