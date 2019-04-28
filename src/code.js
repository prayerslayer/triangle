import p5 from "p5";
import "p5/lib/addons/p5.dom";

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
  let level = 0;

  function addLevel() {
    level += 1;
  }

  const calcCache = new TriangleCache();
  const drawCache = new TriangleCache();

  function drawPoints(points) {
    // noop if already drawn
    const cached = drawCache.getTriangles(points);
    if (cached) {
      return;
    }
    p.beginShape();
    for (const point of points) {
      p.vertex(...point);
    }
    p.endShape(p.CLOSE);
    drawCache.setTriangles(points, true);
  }

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

    let btn = p.createButton("add level");
    btn.position(0, 0);
    btn.mousePressed(addLevel);
  };

  function getSierpinskiTriangles(
    start,
    triangles,
    desiredLevel,
    currentLevel = 0
  ) {
    if (desiredLevel === currentLevel) {
      return triangles;
    }
    const [center, ...others] = subdivideTriangleInPoints(start);
    triangles.push(center);
    for (const part of others) {
      getSierpinskiTriangles(part, triangles, desiredLevel, currentLevel + 1);
    }
    return triangles;
  }

  p.draw = () => {
    const x0 = 100;
    const y0 = 100;
    const s0 = 800;
    p.translate(CANVAS_WIDTH / 3, CANVAS_HEIGHT / 2);

    p.stroke(32, 32, 32);
    p.strokeWeight(1 / level);
    const first = trianglePoints(x0, y0, s0, false);
    drawPoints(first);
    const all = getSierpinskiTriangles(first, [], level);
    for (const triangle of all) {
      drawPoints(triangle);
    }
  };
};
const P5 = new p5(sketch);
