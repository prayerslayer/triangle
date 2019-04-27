import p5 from "p5";

const CANVAS_WIDTH = window.innerWidth - 10;
const CANVAS_HEIGHT = window.innerHeight - 10;
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

  const cache = new TriangleCache();

  // subdivide upright triangle
  function subdivideTriangleInPoints(triangle) {
    const [[ax, ay], [bx, by], [cx, cy]] = triangle;
    const cached = cache.getTriangles(triangle);
    if (cached) {
      return cached;
    }
    const s = bx - ax;
    const bottomLeft = completeUprightTriangle([ax, ay], [ax + s / 2, ay]);
    const bottomRight = completeUprightTriangle([ax + s / 2, ay], [bx, by]);
    const top = completeUprightTriangle(bottomLeft[2], bottomRight[2]);
    const center = [bottomLeft[2], bottomRight[2], bottomLeft[1]];
    const triangles = [center, bottomRight, bottomLeft, top];
    cache.setTriangles(triangle, triangles);
    return triangles;
  }

  p.setup = () => {
    p.createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    p.frameRate(1);
  };

  function drawSierpinskiTriangle(triangle, desiredLevel, currentLevel = 0) {
    if (desiredLevel === currentLevel) {
      return;
    }
    const [center, ...others] = subdivideTriangleInPoints(triangle);
    drawPoints(center);
    for (const part of others) {
      drawSierpinskiTriangle(part, desiredLevel, currentLevel + 1);
    }
  }

  p.draw = () => {
    const first = trianglePoints(500, 500, 700, false);
    if (p.frameCount < 20) {
      drawPoints(first);
      drawSierpinskiTriangle(first, p.frameCount);
    }
  };
};
const P5 = new p5(sketch);
