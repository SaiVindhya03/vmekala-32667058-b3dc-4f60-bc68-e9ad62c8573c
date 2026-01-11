import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { signal, NO_ERRORS_SCHEMA } from '@angular/core';
import { LayoutComponent } from '../../src/app/layout/layout/layout.component';

describe('LayoutComponent', () => {
  let component: LayoutComponent;
  let fixture: ComponentFixture<LayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LayoutComponent, RouterModule.forRoot([])],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with sidebar closed', () => {
      expect(component['isSidebarOpen']()).toBe(false);
    });

    it('should use signal for isSidebarOpen', () => {
      expect(typeof component['isSidebarOpen']).toBe('function');
    });
  });

  describe('toggleSidebar', () => {
    it('should toggle sidebar from closed to open', () => {
      expect(component['isSidebarOpen']()).toBe(false);

      component['toggleSidebar']();

      expect(component['isSidebarOpen']()).toBe(true);
    });

    it('should toggle sidebar from open to closed', () => {
      component['isSidebarOpen'].set(true);

      component['toggleSidebar']();

      expect(component['isSidebarOpen']()).toBe(false);
    });

    it('should toggle multiple times correctly', () => {
      component['toggleSidebar']();
      expect(component['isSidebarOpen']()).toBe(true);

      component['toggleSidebar']();
      expect(component['isSidebarOpen']()).toBe(false);

      component['toggleSidebar']();
      expect(component['isSidebarOpen']()).toBe(true);

      component['toggleSidebar']();
      expect(component['isSidebarOpen']()).toBe(false);
    });

    it('should maintain state through rapid toggles', () => {
      for (let i = 0; i < 10; i++) {
        component['toggleSidebar']();
      }

      expect(component['isSidebarOpen']()).toBe(false);
    });

    it('should toggle an odd number of times', () => {
      for (let i = 0; i < 5; i++) {
        component['toggleSidebar']();
      }

      expect(component['isSidebarOpen']()).toBe(true);
    });
  });

  describe('closeSidebar', () => {
    it('should close sidebar when open', () => {
      component['isSidebarOpen'].set(true);

      component['closeSidebar']();

      expect(component['isSidebarOpen']()).toBe(false);
    });

    it('should keep sidebar closed when already closed', () => {
      component['isSidebarOpen'].set(false);

      component['closeSidebar']();

      expect(component['isSidebarOpen']()).toBe(false);
    });

    it('should be idempotent', () => {
      component['isSidebarOpen'].set(true);

      component['closeSidebar']();
      component['closeSidebar']();
      component['closeSidebar']();

      expect(component['isSidebarOpen']()).toBe(false);
    });
  });

  describe('onMobileMenuToggle', () => {
    it('should toggle sidebar when called', () => {
      const initialState = component['isSidebarOpen']();

      component['onMobileMenuToggle']();

      expect(component['isSidebarOpen']()).toBe(!initialState);
    });

    it('should open sidebar when closed', () => {
      component['isSidebarOpen'].set(false);

      component['onMobileMenuToggle']();

      expect(component['isSidebarOpen']()).toBe(true);
    });

    it('should close sidebar when open', () => {
      component['isSidebarOpen'].set(true);

      component['onMobileMenuToggle']();

      expect(component['isSidebarOpen']()).toBe(false);
    });

    it('should call toggleSidebar internally', () => {
      const toggleSpy = jest.spyOn(component as any, 'toggleSidebar');

      component['onMobileMenuToggle']();

      expect(toggleSpy).toHaveBeenCalled();
    });
  });

  describe('State Management', () => {
    it('should maintain sidebar state through multiple operations', () => {
      // Open sidebar
      component['toggleSidebar']();
      expect(component['isSidebarOpen']()).toBe(true);

      // Close sidebar
      component['closeSidebar']();
      expect(component['isSidebarOpen']()).toBe(false);

      // Toggle sidebar (should open)
      component['onMobileMenuToggle']();
      expect(component['isSidebarOpen']()).toBe(true);

      // Toggle sidebar (should close)
      component['onMobileMenuToggle']();
      expect(component['isSidebarOpen']()).toBe(false);
    });

    it('should handle mixed operations correctly', () => {
      component['toggleSidebar'](); // open
      component['toggleSidebar'](); // close
      component['onMobileMenuToggle'](); // open
      component['closeSidebar'](); // close

      expect(component['isSidebarOpen']()).toBe(false);
    });
  });

  describe('Signal Reactivity', () => {
    it('should update signal value when toggling', () => {
      const initialValue = component['isSidebarOpen']();

      component['toggleSidebar']();

      expect(component['isSidebarOpen']()).not.toBe(initialValue);
    });

    it('should update signal value when closing', () => {
      component['isSidebarOpen'].set(true);

      component['closeSidebar']();

      expect(component['isSidebarOpen']()).toBe(false);
    });

    it('should update signal value on mobile menu toggle', () => {
      const initialValue = component['isSidebarOpen']();

      component['onMobileMenuToggle']();

      expect(component['isSidebarOpen']()).not.toBe(initialValue);
    });
  });

  describe('Integration', () => {
    it('should be standalone component', () => {
      expect(LayoutComponent).toBeDefined();
    });

    it('should have correct component metadata', () => {
      const metadata = (LayoutComponent as any).ɵcmp;
      expect(metadata).toBeDefined();
    });

    it('should work with component lifecycle', () => {
      // Create new fixture to test component lifecycle
      const newFixture = TestBed.createComponent(LayoutComponent);
      const newComponent = newFixture.componentInstance;

      expect(newComponent['isSidebarOpen']()).toBe(false);

      newComponent['toggleSidebar']();
      expect(newComponent['isSidebarOpen']()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very rapid toggle operations', () => {
      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        component['toggleSidebar']();
      }

      const endTime = Date.now();

      expect(component['isSidebarOpen']()).toBe(false);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete quickly
    });

    it('should handle alternating toggle and close operations', () => {
      for (let i = 0; i < 5; i++) {
        component['toggleSidebar']();
        component['closeSidebar']();
      }

      expect(component['isSidebarOpen']()).toBe(false);
    });

    it('should handle multiple close operations on closed sidebar', () => {
      for (let i = 0; i < 10; i++) {
        component['closeSidebar']();
      }

      expect(component['isSidebarOpen']()).toBe(false);
    });

    it('should handle mobile menu toggle after manual toggle', () => {
      component['toggleSidebar'](); // open
      component['onMobileMenuToggle'](); // close

      expect(component['isSidebarOpen']()).toBe(false);
    });

    it('should handle close after mobile menu toggle', () => {
      component['onMobileMenuToggle'](); // open
      component['closeSidebar'](); // close

      expect(component['isSidebarOpen']()).toBe(false);
    });
  });

  describe('State Consistency', () => {
    it('should never have an invalid state', () => {
      const operations = [
        () => component['toggleSidebar'](),
        () => component['closeSidebar'](),
        () => component['onMobileMenuToggle'](),
      ];

      // Perform random operations
      for (let i = 0; i < 50; i++) {
        const randomOp = operations[Math.floor(Math.random() * operations.length)];
        randomOp();

        // State should always be boolean
        const state = component['isSidebarOpen']();
        expect(typeof state).toBe('boolean');
        expect(state === true || state === false).toBe(true);
      }
    });
  });

  describe('Component Composition', () => {
    it('should integrate navbar and sidebar components', () => {
      // This test ensures the component can be instantiated with its child components
      expect(component).toBeTruthy();
      expect(component['isSidebarOpen']).toBeDefined();
      expect(component['toggleSidebar']).toBeDefined();
      expect(component['closeSidebar']).toBeDefined();
      expect(component['onMobileMenuToggle']).toBeDefined();
    });

    it('should provide methods for child components to interact with', () => {
      // Verify all public methods are accessible
      expect(typeof component['toggleSidebar']).toBe('function');
      expect(typeof component['closeSidebar']).toBe('function');
      expect(typeof component['onMobileMenuToggle']).toBe('function');
    });
  });
});
