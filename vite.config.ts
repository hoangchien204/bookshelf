import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import obfuscator from 'rollup-plugin-obfuscator';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Plugin Obfuscator phải nằm trong mảng plugins
    obfuscator({
      global: true, // Áp dụng cho toàn bộ các file trong bundle
      options: {
        compact: true, // Nén code thành 1 dòng
        controlFlowFlattening: true, // Biến logic if/else thành vòng lặp khó hiểu
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: true, // Chèn code rác
        deadCodeInjectionThreshold: 0.4,
        debugProtection: true, // Chặn debugger
        debugProtectionInterval: 2000,
        disableConsoleOutput: true, // Tắt console.log
        identifierNamesGenerator: 'hexadecimal', // Đổi tên biến: _0x1a2b
        log: false,
        numbersToExpressions: true, // Biến số 123 -> ((1+2)*4...)
        renameGlobals: false, // Giữ nguyên tên biến global để tránh lỗi React
        rotateStringArray: true,
        selfDefending: true, // Code tự hỏng nếu bị format
        stringArray: true, // Mã hóa chuỗi
        stringArrayEncoding: ['rc4'], // Mã hóa mạnh RC4
        unicodeEscapeSequence: false,
      },
    }),
  ],
  server: {
    host: true,
    allowedHosts: ['bookshelf-8x8x.onrender.com'],
  },
  build: {
    sourcemap: false,
    minify: 'terser', 
  },
});