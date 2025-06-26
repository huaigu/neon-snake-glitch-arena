
// 简单的控制台日志配置工具
// 在非 localhost 环境下禁用控制台输出

const isLocalhost = () => {
  if (typeof window === 'undefined') return false;
  
  const hostname = window.location.hostname;
  return hostname === 'localhost' || 
         hostname === '127.0.0.1' || 
         hostname === '0.0.0.0' ||
         hostname.startsWith('192.168.') ||
         hostname.startsWith('10.') ||
         hostname.startsWith('172.');
};

// 在非本地环境禁用控制台日志
if (!isLocalhost()) {
  console.log = () => {};
  console.info = () => {};
  console.warn = () => {};
  // 保留 console.error 用于错误追踪
  // console.error = () => {};
}

export { isLocalhost };
