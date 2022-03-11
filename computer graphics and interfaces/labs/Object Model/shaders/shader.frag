precision highp float;

const int MAX_LIGHTS = 3;

struct LightInfo {
    vec3 pos;
    vec3 Ia;
    vec3 Id;
    vec3 Is;
    bool isDirectional;
    bool isActive;
};

struct MaterialInfo {
    vec3 Ka;
    vec3 Kd;
    vec3 Ks;
    float shininess;
};

uniform LightInfo uLight[MAX_LIGHTS]; // The array of lights present in the scene
uniform MaterialInfo uMaterial;  // The material of the object being drawn
uniform mat4 mView;
uniform mat4 mViewNormals;

varying vec3 fNormal;
varying vec3 fViewer;

vec3 colorSum() {
    vec3 colorSum = vec3(0.0,0.0,0.0);

    for(int i = 0; i < MAX_LIGHTS; i++) {
 
        LightInfo light =  uLight[i];

        if(light.isActive) {

        vec3 N = normalize(fNormal);
        vec3 L;

        if(light.isDirectional) 
            L = normalize((mViewNormals * vec4(light.pos, 0.0)).xyz);
        else 
            L = normalize((mView * vec4(light.pos, 1.0)).xyz - fViewer);

        float diffuseFactor = max(dot(N, L), 0.0);
        float specularFactor = 0.0;

        if(diffuseFactor > 0.0) { 
            vec3 R = reflect(-L, N);
            vec3 V = normalize(-fViewer); 

            float specAngle = max(dot(R, V), 0.0);
            specularFactor = pow(specAngle, uMaterial.shininess);
        }

        colorSum += vec3(uMaterial.Ka * light.Ia +
            diffuseFactor * uMaterial.Kd * light.Id +
            specularFactor * uMaterial.Ks * light.Is);
        }
    }
    return colorSum;
}

void main() {
    gl_FragColor = vec4(colorSum(), 1.0);
}