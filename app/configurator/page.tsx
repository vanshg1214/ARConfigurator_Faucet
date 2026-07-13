import ARWrapper from '../components/ARWrapper';

export default function ConfiguratorPage() {
  return (
    <ARWrapper
      src="/configurator/dist/index.html"
      title="3D Faucet Configurator"
      description="An interactive WebAR faucet configurator pitching product customization features. Placed objects exist in real-world scale and respond to ambient lighting reflections."
      features={[
        "SLAM Surface Placement (Click ground)",
        "3D Real-time reflections & shadow casting",
        "Material configuration (Gold, Silver, Matt Black)",
        "Water Flow Animation controls",
        "Smooth gesture scale & rotation adjustments"
      ]}
    />
  );
}
