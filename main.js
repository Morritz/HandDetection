import "./style.css";
// import mediapipe from "@mediapipe/hands";
// import { Camera } from "@mediapipe/camera_utils";

const LikeGestureImage = new Image();
LikeGestureImage.src =
  "https://png.pngtree.com/png-vector/20201227/ourlarge/pngtree-thumb-up-gesture-png-image_2657834.jpg";

function isAscending(arr) {
  return arr.every(function (x, i) {
    return i === 0 || x >= arr[i - 1];
  });
}

function isDescending(arr) {
  return arr.every(function (x, i) {
    return i === 0 || x <= arr[i - 1];
  });
}

const handDetection = new Hands({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
  },
});
handDetection.setOptions({
  modelComplexity: 1,
  selfieMode: true,
  maxNumHands: 2,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});

function detectLike(landmarks, isRight) {
  const isRightHand = !!isRight;
  const rest = landmarks.filter((_, index) => {
    return index != 3 && index != 4;
  });
  const minOfRest = Math.min(
    ...rest.map(function (o) {
      return o.y;
    })
  );
  const l4 = landmarks[4];
  const l3 = landmarks[3];

  const knuckles = [
    [6, 7, 8],
    [10, 11, 12],
    [14, 15, 16],
    [18, 19, 20],
  ];

  if (l4.y < l3.y && l3.y < minOfRest) {
    const tilt = Math.abs(l3.x - l4.x) / Math.abs(l3.y - l4.y);
    const result = tilt < 0.3;
    if (result) {
      for (const knuckle of knuckles) {
        const points = knuckle.map((val) => {
          return landmarks[val].x;
        });
        const checkKnuckles = isRightHand ? isAscending : isDescending;
        if (!checkKnuckles(points)) {
          return false;
        }
      }
      return true;
    }
  }
  return false;
}
let once = false;

handDetection.onResults((results) => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const [index, hand] of results.multiHandLandmarks.entries()) {
    for (const [index, landmark] of hand.entries()) {
      const x = landmark.x * canvas.width;
      const y = landmark.y * canvas.height;
      ctx.font = "20px Arial";
      ctx.fillText(index, x + 5, y + -5);

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = "blue";
      ctx.fill();
      ctx.stroke();
    }
    const result1 = detectLike(hand, results.multiHandedness[index].index);
    // if (!once && result1) {
    //   once = true;
    //   const link = document.createElement("a");
    //   link.href = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&autoplay=1";
    //   link.click();
    // }
    if (result1) {
      ctx.drawImage(LikeGestureImage, 0, 0, 200, 200);
    }
  }
});

const app = document.querySelector("#app");

const cameraDisplay = document.createElement("video");

cameraDisplay.addEventListener("resize", () => {
  canvas.width = cameraDisplay.offsetWidth;
  canvas.height = cameraDisplay.offsetHeight;
});
app.append(cameraDisplay);

const camera = new Camera(cameraDisplay, {
  onFrame: async () => {
    await handDetection.send({ image: cameraDisplay });
  },
  width: 1280,
  height: 720,
});
camera.start().then(() => {});

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
canvas.width = cameraDisplay.offsetWidth;

app.append(canvas);
