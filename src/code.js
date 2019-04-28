import p5 from "p5";

const CANVAS_WIDTH = window.innerWidth;
const CANVAS_HEIGHT = window.innerHeight;
const ROOT_3 = Math.sqrt(3);

function triangleHeight(side) {
  return (ROOT_3 * side) / 2;
}

function triangleCenter(triangle) {
  const [[ax, ay], [bx, by], [cx, cy]] = triangle;
  const s = bx - ax;
  const h = triangleHeight(s);
  return [ax + s / 2, cy - h / 3];
}

function completeUprightTriangle(a, b) {
  const [ax, ay] = a;
  const [bx, by] = b;
  const s = bx - ax;
  const h = triangleHeight(s);
  const cx = ax + s / 2;
  const cy = ay - h;
  return [a, b, [cx, cy]];
}

function trianglePoints(x0, y0, s, upsideDown = false) {
  const h = triangleHeight(s);

  // not upside down
  let cy = y0 - (2 / 3) * h;
  let cx = x0;
  let bx = cx + s / 2;
  let by = cy + h;
  let ax = bx - s;
  let ay = by;

  if (upsideDown) {
    cy = y0 + (2 / 3) * h;
    by = cy - h;
    ay = by;
  }

  return [[ax, ay], [bx, by], [cx, cy]];
}

function TriangleCache() {
  const TRIANGLES = new Map();
  function cacheKey(triangle) {
    const center = triangleCenter(triangle);
    return String(center[0]) + "," + String(center[1]);
  }
  this.setTriangles = function(parent, children) {
    TRIANGLES.set(cacheKey(parent), children);
  };
  this.getTriangles = function(parent) {
    return TRIANGLES.get(cacheKey(parent));
  };
  return this;
}

const sketch = p => {
  function drawPoints(points) {
    p.beginShape();
    for (const point of points) {
      p.vertex(...point);
    }
    p.endShape(p.CLOSE);
  }

  const calcCache = new TriangleCache();
  const drawCache = new TriangleCache();

  // subdivide upright triangle
  function subdivideTriangleInPoints(triangle) {
    const [[ax, ay], [bx, by], [cx, cy]] = triangle;
    const cached = calcCache.getTriangles(triangle);
    if (cached) {
      return cached;
    }
    const s = bx - ax;
    const bottomLeft = completeUprightTriangle([ax, ay], [ax + s / 2, ay]);
    const bottomRight = completeUprightTriangle([ax + s / 2, ay], [bx, by]);
    const top = completeUprightTriangle(bottomLeft[2], bottomRight[2]);
    const center = [bottomLeft[2], bottomRight[2], bottomLeft[1]];
    const triangles = [center, bottomRight, bottomLeft, top];
    calcCache.setTriangles(triangle, triangles);
    return triangles;
  }

  p.setup = () => {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(5);
  };

  function drawSierpinskiTriangle(triangle, desiredLevel, currentLevel = 0) {
    if (desiredLevel === currentLevel) {
      return;
    }
    const [center, ...others] = subdivideTriangleInPoints(triangle);
    if (!drawCache.getTriangles(center)) {
      drawPoints(center);
      drawCache.setTriangles(center, true);
    }
    for (const part of others) {
      drawSierpinskiTriangle(part, desiredLevel, currentLevel + 1);
    }
  }

  p.draw = () => {
    const x0 = 100;
    const y0 = 100;
    const s0 = 800;
    if (p.frameCount <= 11) {
      p.clear();
      p.stroke(32, 32, 32);
      const scaleFactor = p.frameCount * 1.1;
      const x = scaleFactor * x0;
      const y = scaleFactor * y0;
      p.translate(CANVAS_WIDTH / 3, CANVAS_HEIGHT / 2);
      //p.rotate((p.frameCount * p.PI) / 3);
      //p.translate(0, -triangleHeight(y));
      p.strokeWeight(1 / scaleFactor);
      //p.scale(scaleFactor);
      const first = trianglePoints(x0, y0, s0, false);
      drawSierpinskiTriangle(first, p.frameCount);
    }
  };
};
const P5 = new p5(sketch);
