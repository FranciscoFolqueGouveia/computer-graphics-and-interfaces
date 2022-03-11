attribute vec4 vPosition; // vertex position in modelling coordinates
attribute vec4 vNormal; // vertex normal in modelling coordinates

uniform mat4 mModelView; // model-view transformation
uniform mat4 mNormals; // model-view transformation for normals
uniform mat4 mProjection; // projection matrix

varying vec3 fNormal; // normal vector in camera space
varying vec3 fViewer; // View vector in camera space

void main(){

    vec3 posC = (mModelView * vPosition).xyz;
    fNormal = (mNormals * vNormal).xyz;
    fViewer = posC;

    gl_Position = mProjection * mModelView * vPosition;
}