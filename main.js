'use strict';

let gl;                         // The webgl context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.

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
let parameters2 = ['x', 'y', 'z', 'r', 'g', 'b'];

parameters.forEach((param) => {
    console.log(param)
    document.getElementById(param).addEventListener("change", function () {
        let rValue = document.getElementById(param).value;
        document.getElementById(param + '-add').textContent = rValue;
        updateSurface();
    });
    console.log(param)
});
parameters2.forEach((p) => {
    document.getElementById(p).addEventListener("change", function () {
        updateSurface();
    })
})

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
    this.iNormalBuffer = gl.createBuffer();
    this.count = 0;

    this.BufferData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

        this.count = vertices.length / 3;
    }
    this.BufferNormalData = function (vertices) {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
    }

    this.Draw = function () {

        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribNormal);

        gl.drawArrays(gl.TRIANGLES, 0, this.count);
        console.log(this.count)
        // for (let i = 0; i <= vert; i += segments) {
        //     gl.drawArrays(gl.LINE_STRIP, i, segments1);
        // }

        // for (let i = vert; i <= this.count; i += segments) {
        //     gl.drawArrays(gl.LINE_STRIP, i, segments);
        // }

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
    gl.uniform4fv(shProgram.iColor, [1, 1, 0, 1]);
    let x = document.getElementById('x').value
    let y = document.getElementById('y').value
    let z = document.getElementById('z').value
    gl.uniform3fv(shProgram.iDirectionOfLight, [x, y, z]);
    let r = document.getElementById('r').value
    let g = document.getElementById('g').value
    let b = document.getElementById('b').value
    gl.uniform3fv(shProgram.iDiffuseComponent, [r, g, b]);

    surface.Draw();
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
            let norm1 = CreateVertex(R, a, n, phi, v)
            let norm2 = CreateVertex(R, a, n, phi + phiIncrement, v)
            let norm3 = CreateVertex(R, a, n, phi, v + vIncrement)
            let norm4 = CreateVertex(R, a, n, phi + phiIncrement, v + vIncrement)
            vertexList.push(
                ...vert1,
                ...vert2,
                ...vert3,
                ...vert3,
                ...vert2,
                ...vert4,
            );
            normalList.push(
                ...norm1,
                ...norm2,
                ...norm3,
                ...norm3,
                ...norm2,
                ...norm4,
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
    shProgram.iAttribNormal = gl.getAttribLocation(prog, "normal");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iModelNormalMatrix = gl.getUniformLocation(prog, "ModelNormalMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.iDirectionOfLight = gl.getUniformLocation(prog, "directionOfLight");
    shProgram.iDiffuseComponent = gl.getUniformLocation(prog, "diffuseComponent");

    surface = new Model('Surface');
    let surfaceData = CreateSurfaceData(R, a, n, segments)

    surface.BufferData(surfaceData.vertices);
    surface.BufferNormalData(surfaceData.normals);

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

    draw();
}
