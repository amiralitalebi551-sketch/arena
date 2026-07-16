import noise from "./noise.glsl";
import coreVertRaw from "./core.vert.glsl";
import coreFragRaw from "./core.frag.glsl";
import particlesVertRaw from "./particles.vert.glsl";
import particlesFragRaw from "./particles.frag.glsl";

const inject = (src: string) => src.replace("__NOISE__", noise);

export const coreVert = inject(coreVertRaw);
export const coreFrag = coreFragRaw;
export const particlesVert = inject(particlesVertRaw);
export const particlesFrag = particlesFragRaw;
