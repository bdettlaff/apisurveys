export const Background = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden bg-[#fafafa]">
    <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-200/40 blur-[120px] rounded-full"></div>
    <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] bg-purple-200/30 blur-[100px] rounded-full"></div>
    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
  </div>
);
