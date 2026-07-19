import { formatDuration } from '@/utils/date';

describe('formatDuration', () => {
  it('renders negative timer values as zero', () => {
    expect(formatDuration(-1)).toBe('0分钟');
  });

  it('formats minute and hour boundaries', () => {
    expect(formatDuration(61)).toBe('1分1秒');
    expect(formatDuration(3600)).toBe('1小时0分');
  });
});
