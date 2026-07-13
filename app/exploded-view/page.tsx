import ARWrapper from '../components/ARWrapper';

export default function ExplodedViewPage() {
  return (
    <ARWrapper
      src="/exploded-view/dist/index.html"
      title="3D Turbofan Engine Placement"
      description="A clean industrial CAD model showcase. Spawns a highly detailed Turbofan Jet Engine in real-world scale directly into your environment using SLAM surface tracking."
      features={[
        "SLAM Surface tracking and reticle feedback",
        "Spawns industrial Turbofan Engine (turbine__turbofan_engine.glb)",
        "Micro-offset base calibration (Y-axis aligned)",
        "Smooth gesture scaling and rotation adjustments"
      ]}
    />
  );
}
