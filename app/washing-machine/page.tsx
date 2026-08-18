import ARWrapper from '../components/ARWrapper';

export default function WashingMachinePage() {
  return (
    <ARWrapper
      src="/washing-machine/dist/index.html"
      title="MATRI6 AR"
      description="An interactive WebAR experience for placing a washing machine in your environment."
      features={[
        "SLAM Surface Placement (Click ground)",
        "3D Real-time reflections & shadow casting"
      ]}
    />
  );
}
