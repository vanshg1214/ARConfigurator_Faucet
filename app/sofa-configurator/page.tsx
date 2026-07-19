import ARWrapper from '../components/ARWrapper';

export default function SofaConfiguratorPage() {
  return (
    <ARWrapper
      src="/sofa-configurator/dist/index.html"
      title="3D Sofa Configurator"
      description="An interactive WebAR sofa configurator. Currently set up with a placeholder cactus model for testing the single-placement logic."
      features={[
        "SLAM Surface Placement (Click ground)",
        "Single-instance tracking",
        "Smooth gesture scale & rotation adjustments"
      ]}
    />
  );
}
