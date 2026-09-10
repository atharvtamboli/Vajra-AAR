#!/usr/bin/env python3

import cv2
import time
import argparse
import numpy as np

try:
    import ncnn
except ImportError:
    print("ERROR: ncnn Python module is not installed.")
    print("For maximum performance, use native C++ NCNN.")
    exit(1)


def letterbox(image, size=640):
    h, w = image.shape[:2]

    scale = min(size / w, size / h)

    nw = int(w * scale)
    nh = int(h * scale)

    resized = cv2.resize(image, (nw, nh))

    canvas = np.full(
        (size, size, 3),
        114,
        dtype=np.uint8
    )

    dx = (size - nw) // 2
    dy = (size - nh) // 2

    canvas[
        dy:dy + nh,
        dx:dx + nw
    ] = resized

    return canvas, scale, dx, dy


def main():

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--param",
        required=True
    )

    parser.add_argument(
        "--bin",
        required=True
    )

    parser.add_argument(
        "--camera",
        default="/dev/video0"
    )

    parser.add_argument(
        "--size",
        type=int,
        default=640
    )

    args = parser.parse_args()

    # ------------------------------------------------
    # NCNN network
    # ------------------------------------------------

    net = ncnn.Net()

    net.opt.use_vulkan_compute = False

    print("[INFO] Loading NCNN model...")

    net.load_param(args.param)
    net.load_model(args.bin)

    print("[INFO] Model loaded.")

    # ------------------------------------------------
    # Camera
    # ------------------------------------------------

    cap = cv2.VideoCapture(
        args.camera,
        cv2.CAP_V4L2
    )

    if not cap.isOpened():
        print("[ERROR] Could not open camera")
        return

    # Request MJPEG from USB camera

    cap.set(
        cv2.CAP_PROP_FOURCC,
        cv2.VideoWriter_fourcc(*"MJPG")
    )

    cap.set(
        cv2.CAP_PROP_FRAME_WIDTH,
        1280
    )

    cap.set(
        cv2.CAP_PROP_FRAME_HEIGHT,
        720
    )

    cap.set(
        cv2.CAP_PROP_FPS,
        30
    )

    print("[INFO] Camera started.")

    # ------------------------------------------------
    # FPS
    # ------------------------------------------------

    frames = 0
    start = time.time()

    while True:

        ret, frame = cap.read()

        if not ret:
            print("[ERROR] Camera frame failed")
            break

        # ------------------------------------------------
        # PREPROCESS
        # ------------------------------------------------

        image, scale, pad_x, pad_y = letterbox(
            frame,
            args.size
        )

        # BGR → RGB

        image = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2RGB
        )

        # ------------------------------------------------
        # NCNN IMAGE
        # ------------------------------------------------

        mat = ncnn.Mat.from_pixels(
            image,
            ncnn.Mat.PixelType.PIXEL_RGB,
            args.size,
            args.size
        )

        # Normalize

        mean_vals = [
            0.0,
            0.0,
            0.0
        ]

        norm_vals = [
            1 / 255.0,
            1 / 255.0,
            1 / 255.0
        ]

        mat.substract_mean_normalize(
            mean_vals,
            norm_vals
        )

        # ------------------------------------------------
        # INFERENCE
        # ------------------------------------------------

        extractor = net.create_extractor()

        # Input tensor name depends on exported model.
        #
        # Common YOLO NCNN exports use "in0".
        #
        # Verify this with your exported model.

        extractor.input(
            "in0",
            mat
        )

        # Output name also depends on model export.

        ret, output = extractor.extract(
            "out0"
        )

        if ret != 0:

            print(
                "\n[ERROR] NCNN inference failed."
            )

            break

        # ------------------------------------------------
        # OUTPUT
        # ------------------------------------------------

        # IMPORTANT:
        #
        # YOLO26n NCNN output decoding depends on
        # the exact exported model.
        #
        # Print shape first while integrating.

        if frames == 0:

            print(
                "\n[INFO] NCNN output shape:"
            )

            print(output.shape)

        # ------------------------------------------------
        # FPS
        # ------------------------------------------------

        frames += 1

        elapsed = time.time() - start

        if elapsed >= 1:

            fps = frames / elapsed

            print(
                f"\rInference FPS: {fps:.2f}",
                end=""
            )

            frames = 0
            start = time.time()

        # ------------------------------------------------
        # DISPLAY
        # ------------------------------------------------

        cv2.putText(
            frame,
            "Vajra AAR - NCNN",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            1,
            (0, 255, 0),
            2
        )

        cv2.imshow(
            "Vajra AAR",
            frame
        )

        key = cv2.waitKey(1)

        if key == 27 or key == ord("q"):
            break

    cap.release()

    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
