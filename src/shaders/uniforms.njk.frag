struct Camera {
    vec3 pos;
    vec3 target;
    float fov;
    vec3 up;
};

struct Sphere {
    vec3 center;
    vec2 r;
};

struct Plane {
    vec3 origin;
    vec3 normal;
};

uniform vec2 u_resolution;
uniform Camera u_camera;
uniform Sphere u_prismSpheres[{{ numPrismSpheres }}];
uniform Plane u_prismPlanes[{{ numPrismPlanes }}];
uniform Sphere u_inversionSphere;
uniform Sphere u_convexSphere;
uniform Sphere u_spheirahedraSpheres[{{ numSpheirahedraSpheres }}];
uniform Sphere u_seedSpheres[{{ numSeedSpheres }}];
uniform float u_fudgeFactor;
uniform float u_marchingThreshold;
uniform int u_maxIterations;
uniform vec3 u_dividePlaneOrigin;
uniform vec3 u_dividePlaneNormal;
