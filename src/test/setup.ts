import { vi } from 'vitest';

/**
 * Vitest测试环境设置文件
 * 在所有测试运行前执行
 */

// Mock console方法以减少测试输出噪音
vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'debug').mockImplementation(() => {});

// 全局测试超时设置
vi.setConfig({ testTimeout: 10000 });

// Mock process.env以避免环境变量问题
process.env.NODE_ENV = 'test';

// 设置时区
process.env.TZ = 'UTC';
