'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.
let texPoint = [0, 0]
let sphere;

let R = 1;
let a = 0.5;
let n = 5;
let segments = 30;
let segments1 = 60;
let vert = 0;
let goriz = 0;

function deg2rad(angle) {
    return angle * Math.PI / 180;
}

let parameters = ['R', 'a'];

parameters.forEach((param) => {
    console.log(param)
    document.getElementById(param).addEventListener("change", function () {
        let rValue = document.getElementById(param).value;
        document.getElementById(param + '-add').textContent = rValue;
        updateSurface();
    });
    console.log(param)
});
function updateSurface() {
    R = parseFloat(document.getElementById('R').value);
    a = parseFloat(document.getElementById('a').value);
    let surfaceData = CreateSurfaceData(R, a, n, segments)
    surface.BufferData(surfaceData.vertices);
    surface.BufferNormalData(surfaceData.normals);
    draw();
}
// Constructor
function Model(name) {
    this.name = name;
    this.iVertexBuffer = gl.createBuffer();
    this.iTextureBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }
    this.BufferNormalData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuffer);
        gl.vertexAttribPointer(shProgram.iAttribTexCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribTexCoord);

        gl.drawArrays(gl.TRIANGLES, 0, this.count);
    }
}

function CreateSphereList(step, r = 0.2) {
    let vertexList = [];

    let u = 0,
        v = 0;
    while (u < Math.PI * 2) {
        while (v < Math.PI) {
            let v1 = getSphereVertex(u, v, r);
            let v2 = getSphereVertex(u + step, v, r);
            let v3 = getSphereVertex(u, v + step, r);
            let v4 = getSphereVertex(u + step, v + step, r);
            vertexList.push(v1.x, v1.y, v1.z);
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v3.x, v3.y, v3.z);
            vertexList.push(v3.x, v3.y, v3.z);
            vertexList.push(v2.x, v2.y, v2.z);
            vertexList.push(v4.x, v4.y, v4.z);
            v += step;
        }
        v = 0;
        u += step;
    }
    return vertexList;
}
function getSphereVertex(long, lat, r) {
    return {
        x: r * Math.cos(long) * Math.sin(lat),
        y: r * Math.sin(long) * Math.sin(lat),
        z: r * Math.cos(lat)
    }
}


// Constructor
function ShaderProgram(name, program) {

    this.name = name;
    this.prog = program;

    // Location of the attribute variable in the shader program.
    this.iAttribVertex = -1;
    // Location of the uniform specifying a color for the primitive.
    this.iColor = -1;
    // Location of the uniform matrix representing the combined transformation.
    this.iModelViewProjectionMatrix = -1;

    this.Use = function () {
        gl.useProgram(this.prog);
    }
}


/* Draws a colored cube, along with a set of coordinate axes.
 * (Note that the use of the above drawPrimitive function is not an efficient
 * way to draw with WebGL.  Here, the geometry is so simple that it doesn't matter.)
 */
function draw() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    /* Set the values of the projection transformation */
    let projection = m4.perspective(Math.PI / 8, 1, 8, 20);

    /* Get the view matrix from the SimpleRotator object.*/
    let modelView = spaceball.getViewMatrix();

    let rotateToPointZero = m4.axisRotation([0.707, 0.707, 0], 0.7);
    let translateToPointZero = m4.translation(0, 0, -14);

    let matAccum0 = m4.multiply(rotateToPointZero, modelView);
    let matAccum1 = m4.multiply(translateToPointZero, matAccum0);

    /* Multiply the projection matrix times the modelview matrix to give the
       combined transformation matrix, and send that to the shader program. */
    let modelViewProjection = m4.multiply(projection, matAccum1);
    let modelNormalMatrix = m4.identity();
    m4.inverse(modelView, modelNormalMatrix);
    modelNormalMatrix = m4.transpose(modelNormalMatrix, modelNormalMatrix);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    gl.uniformMatrix4fv(shProgram.iModelNormalMatrix, false, modelNormalMatrix);

    /* Draw the six faces of a cube, with different colors. */
    gl.uniform4fv(shProgram.iColor, [1, 1, 0, 0]);
    gl.uniform2f(shProgram.iTexPoint, texPoint[0] / (Math.PI * 2), texPoint[1] / Math.PI);
    gl.uniform1f(shProgram.iRotate, document.getElementById('rotate').value);

    surface.Draw();
    gl.uniform4fv(shProgram.iColor, [1, 0, 1, 1]);
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, m4.multiply(modelViewProjection, m4.translation(...CreateVertex(R, a, n, ...texPoint))));
    sphere.Draw()
}

let CreateVertex = (R, a, n, phi, v) => {
    let x = (R * Math.cos(v) + a * (1 - Math.sin(v)) * Math.cos(n * phi)) * Math.cos(phi);
    let y = (R * Math.cos(v) + a * (1 - Math.sin(v)) * Math.cos(n * phi)) * Math.sin(phi);
    let z = R * Math.sin(v);
    return [x, y, z]
}

const inc = 0.0001;
let CreateNormal = (R, a, n, phi, v) => {
    let vert = CreateVertex(R, a, n, phi, v),
        vPhi = CreateVertex(R, a, n, phi + inc, v),
        vV = CreateVertex(R, a, n, phi, v + inc)
    const dPhi = [], dV = []
    for (let i = 0; i < 3; i++) {
        dPhi.push((v[i] - vPhi[i]) / inc)
        dV.push((v[i] - vV[i]) / inc)
    }
    const norm = m4.normalize(m4.cross(dPhi, dV))
    return norm
}

function map(value, a, b, c, d) {
    value = (value - a) / (b - a);
    return c + value * (d - c);
}

function CreateSurfaceData(R, a, n, segments) {
    let vertexList = [];
    let normalList = [];

    for (let i = 0; i <= segments; i++) {
        for (let j = 0; j <= segments1; j++) {
            let phi = (j / segments1) * Math.PI * 2;  // phi parameter (0 to 2pi)
            let v = (i / segments) * Math.PI;       // v parameter (0 to pi)
            let phiIncrement = (1 / segments1) * Math.PI * 2;       // v parameter (0 to pi)
            let vIncrement = (1 / segments) * Math.PI;       // v parameter (0 to pi)
            vert++;
            let vert1 = CreateVertex(R, a, n, phi, v)
            let vert2 = CreateVertex(R, a, n, phi + phiIncrement, v)
            let vert3 = CreateVertex(R, a, n, phi, v + vIncrement)
            let vert4 = CreateVertex(R, a, n, phi + phiIncrement, v + vIncrement)
            let tex1 = [phi / (Math.PI * 2), v / Math.PI]
            let tex2 = [(phi + phiIncrement) / (Math.PI * 2), v / Math.PI]
            let tex3 = [phi / (Math.PI * 2), (v + vIncrement) / Math.PI]
            let tex4 = [(phi + phiIncrement) / (Math.PI * 2), (v + vIncrement) / Math.PI]
            vertexList.push(
                ...vert1,
                ...vert2,
                ...vert3,
                ...vert3,
                ...vert2,
                ...vert4,
            );
            normalList.push(
                ...tex1,
                ...tex2,
                ...tex3,
                ...tex3,
                ...tex2,
                ...tex4,
            );
        }
    }
    return {
        vertices: vertexList,
        normals: normalList
    };
}


/* Initialize the WebGL context. Called from init() */
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram('Basic', prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iAttribTexCoord = gl.getAttribLocation(prog, "texCoord");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.iTexPoint = gl.getUniformLocation(prog, "texPoint");
    shProgram.iRotate = gl.getUniformLocation(prog, "rotate");

    surface = new Model('Surface');
    let surfaceData = CreateSurfaceData(R, a, n, segments)

    surface.BufferData(surfaceData.vertices);
    surface.BufferNormalData(surfaceData.normals);

    sphere = new Model()
    sphere.BufferData(CreateSphereList(1, 0.1))
    sphere.BufferNormalData(CreateSphereList(1, 0.1))

    gl.enable(gl.DEPTH_TEST);
}


/* Creates a program for use in the WebGL context gl, and returns the
 * identifier for that program.  If an error occurs while compiling or
 * linking the program, an exception of type Error is thrown.  The error
 * string contains the compilation or linking error.  If no error occurs,
 * the program identifier is the return value of the function.
 * The second and third parameters are strings that contain the
 * source code for the vertex shader and for the fragment shader.
 */
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader:  " + gl.getShaderInfoLog(vsh));
    }
    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader:  " + gl.getShaderInfoLog(fsh));
    }
    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program:  " + gl.getProgramInfoLog(prog));
    }
    return prog;
}


/**
 * initialization function that will be called when the page has loaded
 */
function init() {
    let canvas;
    try {
        canvas = document.getElementById("webglcanvas");
        gl = canvas.getContext("webgl");
        if (!gl) {
            throw "Browser does not support WebGL";
        }
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }
    try {
        initGL();  // initialize the WebGL graphics context
    }
    catch (e) {
        document.getElementById("canvas-holder").innerHTML =
            "<p>Sorry, could not initialize the WebGL graphics context: " + e + "</p>";
        return;
    }

    spaceball = new TrackballRotator(canvas, draw, 0);
    LoadTexture()
    draw();
}

function LoadTexture() {
    let texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

    const image = new Image();
    image.crossOrigin = 'anonymus';
    image.src = "https://raw.githubusercontent.com/oleksandr-yakov/VG2I-lab1/CGW/gif/butterfly-icon.jpg";
    image.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            image
        );
        console.log("imageLoaded")
        draw()
    }
}

window.onkeydown = (e) => {
    if (e.keyCode == 87) {
        texPoint[0] = Math.min(texPoint[0] + 0.1, Math.PI * 2);
    }
    else if (e.keyCode == 65) {
        texPoint[1] = Math.max(texPoint[1] - 0.1, 0);
    }
    else if (e.keyCode == 83) {
        texPoint[0] = Math.max(texPoint[0] - 0.1, 0);
    }
    else if (e.keyCode == 68) {
        texPoint[1] = Math.min(texPoint[1] + 0.1, Math.PI);
    }
    draw()
}