precision highp float;
varying vec4 fColor;

void main() {
    gl_FragColor = fColor;

    vec2 fragPos = 2.0 * gl_PointCoord - 1.0;
    float dist = length(fragPos);
    float distSqrd = dist * dist;
    
    if(distSqrd > 1.0) discard;
    
    if(gl_FragColor.x == 0.0) {
        if (fragPos[0]<0.8 && fragPos[0]>-0.8 && fragPos[1]<0.3 && fragPos[1]>-0.3) discard;
        if (fragPos[1]<0.75 && fragPos[1]>-0.75 && fragPos[0]<0.3 && fragPos[0]>-0.3) discard;
    } else { 
        if (fragPos[0]<0.75 && fragPos[0]>-0.75 && fragPos[1]<0.3 && fragPos[1]>-0.3) discard;
    }
}