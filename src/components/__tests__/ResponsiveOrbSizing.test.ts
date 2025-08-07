import { describe, it, expect } from 'vitest';

describe('Responsive Orb Sizing', () => {
  // Test the orb size calculation logic (extracted from Cell component)
  const calculateOrbSizes = (cellSize: number) => {
    const baseOrbRatio = 0.15; // 15% of cell size for individual orbs
    const largeOrbRatio = 0.2;  // 20% of cell size for count display orb
    
    const individualOrbSize = Math.max(6, Math.floor(cellSize * baseOrbRatio)); // Min 6px
    const countOrbSize = Math.max(8, Math.floor(cellSize * largeOrbRatio));      // Min 8px
    const fontSize = Math.max(10, Math.floor(cellSize * 0.25));                  // Min 10px for text
    const criticalFontSize = Math.max(8, Math.floor(cellSize * 0.2));           // Min 8px for critical mass
    
    return {
      individual: individualOrbSize,
      count: countOrbSize,
      fontSize,
      criticalFontSize
    };
  };

  // Test the animated orb size calculation logic (extracted from AnimatedCell component)
  const calculateAnimatedOrbSizes = (cellSize: number) => {
    const orbRatio = 0.3; // 30% of cell size for animated orbs
    const fontSize = Math.max(12, Math.floor(cellSize * 0.35)); // 35% for text
    const criticalFontSize = Math.max(8, Math.floor(cellSize * 0.15)); // 15% for critical indicator
    
    const orbSize = Math.max(12, Math.floor(cellSize * orbRatio)); // Min 12px for animations
    
    return {
      orb: orbSize,
      fontSize,
      criticalFontSize
    };
  };

  describe('Cell Component Orb Sizing', () => {
    it('should calculate correct orb sizes for small cells', () => {
      const sizes = calculateOrbSizes(30); // Very small cell
      
      expect(sizes.individual).toBe(6); // Minimum enforced
      expect(sizes.count).toBe(8); // Minimum enforced
      expect(sizes.fontSize).toBe(10); // Minimum enforced
      expect(sizes.criticalFontSize).toBe(8); // Minimum enforced
    });

    it('should calculate correct orb sizes for medium cells', () => {
      const sizes = calculateOrbSizes(60); // Medium cell
      
      expect(sizes.individual).toBe(9); // 60 * 0.15 = 9
      expect(sizes.count).toBe(12); // 60 * 0.2 = 12
      expect(sizes.fontSize).toBe(15); // 60 * 0.25 = 15
      expect(sizes.criticalFontSize).toBe(12); // 60 * 0.2 = 12
    });

    it('should calculate correct orb sizes for large cells', () => {
      const sizes = calculateOrbSizes(80); // Large cell
      
      expect(sizes.individual).toBe(12); // 80 * 0.15 = 12
      expect(sizes.count).toBe(16); // 80 * 0.2 = 16
      expect(sizes.fontSize).toBe(20); // 80 * 0.25 = 20
      expect(sizes.criticalFontSize).toBe(16); // 80 * 0.2 = 16
    });
  });

  describe('AnimatedCell Component Orb Sizing', () => {
    it('should calculate correct animated orb sizes for small cells', () => {
      const sizes = calculateAnimatedOrbSizes(30);
      
      expect(sizes.orb).toBe(12); // Minimum enforced
      expect(sizes.fontSize).toBe(12); // Minimum enforced  
      expect(sizes.criticalFontSize).toBe(8); // Minimum enforced
    });

    it('should calculate correct animated orb sizes for medium cells', () => {
      const sizes = calculateAnimatedOrbSizes(60);
      
      expect(sizes.orb).toBe(18); // 60 * 0.3 = 18
      expect(sizes.fontSize).toBe(21); // 60 * 0.35 = 21
      expect(sizes.criticalFontSize).toBe(9); // 60 * 0.15 = 9
    });

    it('should calculate correct animated orb sizes for large cells', () => {
      const sizes = calculateAnimatedOrbSizes(80);
      
      expect(sizes.orb).toBe(24); // 80 * 0.3 = 24
      expect(sizes.fontSize).toBe(28); // 80 * 0.35 = 28
      expect(sizes.criticalFontSize).toBe(12); // 80 * 0.15 = 12
    });
  });

  describe('Size Proportions', () => {
    it('should maintain proper proportions between orb sizes', () => {
      const cellSizes = [40, 60, 80, 100];
      
      cellSizes.forEach(cellSize => {
        const staticSizes = calculateOrbSizes(cellSize);
        const animatedSizes = calculateAnimatedOrbSizes(cellSize);
        
        // Individual orbs should be smaller than count display orbs
        expect(staticSizes.individual).toBeLessThanOrEqual(staticSizes.count);
        
        // Animated orbs should be larger than static orbs (for better visibility during animation)
        if (cellSize >= 40) { // Above minimum thresholds
          expect(animatedSizes.orb).toBeGreaterThan(staticSizes.individual);
        }
        
        // Font sizes should scale appropriately
        expect(staticSizes.fontSize).toBeGreaterThan(staticSizes.criticalFontSize);
      });
    });
  });

  describe('Minimum Size Enforcement', () => {
    it('should enforce minimum sizes for usability', () => {
      const verySmallCell = 10;
      const staticSizes = calculateOrbSizes(verySmallCell);
      const animatedSizes = calculateAnimatedOrbSizes(verySmallCell);
      
      // All sizes should meet minimum requirements
      expect(staticSizes.individual).toBeGreaterThanOrEqual(6);
      expect(staticSizes.count).toBeGreaterThanOrEqual(8);
      expect(staticSizes.fontSize).toBeGreaterThanOrEqual(10);
      expect(staticSizes.criticalFontSize).toBeGreaterThanOrEqual(8);
      expect(animatedSizes.orb).toBeGreaterThanOrEqual(12);
    });
  });
});
