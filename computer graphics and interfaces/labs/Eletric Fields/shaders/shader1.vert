precision highp float;
attribute vec4 vPosition;
attribute float vMove;
const int MAX_CHARGES=30;
const float maxLength = 0.25;
const float scale = 1e-11;
uniform float uTable_width, uTable_height;
uniform vec2 uPosition[MAX_CHARGES];
uniform float uCharge[MAX_CHARGES];
varying vec4 fColor;


#define TWOPI 6.28318530718
#define Ke 8.988e9

// convert angle to hue; returns RGB
// colors corresponding to (angle mod TWOPI):
// 0=red, PI/2=yellow-green, PI=cyan, -PI/2=purple
vec3 angle_to_hue(float angle) {
  angle /= TWOPI;
  return clamp((abs(fract(angle+vec3(3.0, 2.0, 1.0)/3.0)*6.0-3.0)-1.0), 0.0, 1.0);
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

vec4 colorize(vec2 f)
{
    float a = atan(f.y, f.x);
    return vec4(angle_to_hue(a-TWOPI), 1.);
}

void calculate(){
    vec2 force = vec2(0.0, 0.0);
    vec2 norm = vec2(0.0, 0.0);
    
    for(int i = 0; i < MAX_CHARGES; i++) {
    
        if(uCharge[i] != 0.0){
            float inten;
            float dist = distance(vPosition.xy, uPosition[i]); 
            norm = vPosition.xy - uPosition[i];
            inten = ((Ke * uCharge[i]) / (dist * dist));
            force += inten * norm * scale;
        }
    }
    if(length(force) >= maxLength){
        force = normalize(force) * maxLength;
    }
    fColor = colorize(force);
    gl_Position = vec4((vPosition.x + force.x)/(uTable_width/2.0), (vPosition.y + force.y)/(uTable_height/2.0), vPosition.z, vPosition.w);
    
}

void main() {
    gl_PointSize = 4.0;
    if(vMove == 1.0){
        calculate();
    }else {
        gl_Position = vec4(vPosition.x/(uTable_width/2.0), vPosition.y/(uTable_height/2.0), vPosition.z, vPosition.w);
        fColor = vec4(0.0, 0.0, 0.0, 1.0);
    }
}