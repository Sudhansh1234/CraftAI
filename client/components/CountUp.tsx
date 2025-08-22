import { useCountUp } from '@/hooks/useCountUp';

interface CountUpProps {
  end: number;
  duration?: number;
  delay?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
}

export function CountUp({ 
  end, 
  duration = 2000, 
  delay = 0, 
  suffix = '', 
  prefix = '',
  className = ''
}: CountUpProps) {
  const { value, ref } = useCountUp({ end, duration, delay, suffix, prefix });

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
