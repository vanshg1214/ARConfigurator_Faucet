import ARWrapper from '../components/ARWrapper';

export default function ImageTrackingPage() {
  return (
    <ARWrapper
      src="/image-tracking/dist/index.html"
      title="Image Tracking Demo"
      description="WebAR image tracking mode. Point your camera at the target image to see the 3D model anchor to it."
      features={[
        "Image Tracking (Anchor 3D objects to 2D prints)",
        "Real-time pose updates",
        "Multiple target support (if configured)"
      ]}
    />
  );
}
