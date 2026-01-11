import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { SidebarComponent } from '../../src/app/layout/sidebar/sidebar.component';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent, RouterModule.forRoot([])],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Navigation Links', () => {
    it('should have Dashboard link', () => {
      const dashboardLink = component['navLinks'].find((link) => link.label === 'Dashboard');

      expect(dashboardLink).toBeDefined();
      expect(dashboardLink?.route).toBe('/dashboard');
      expect(dashboardLink?.icon).toBeTruthy();
    });

    it('should have Task List link', () => {
      const taskListLink = component['navLinks'].find((link) => link.label === 'Task List');

      expect(taskListLink).toBeDefined();
      expect(taskListLink?.route).toBe('/tasks');
      expect(taskListLink?.icon).toBeTruthy();
    });

    it('should have Task Board link', () => {
      const taskBoardLink = component['navLinks'].find((link) => link.label === 'Task Board');

      expect(taskBoardLink).toBeDefined();
      expect(taskBoardLink?.route).toBe('/board');
      expect(taskBoardLink?.icon).toBeTruthy();
    });

    it('should have Audit Log link', () => {
      const auditLogLink = component['navLinks'].find((link) => link.label === 'Audit Log');

      expect(auditLogLink).toBeDefined();
      expect(auditLogLink?.route).toBe('/audit-log');
      expect(auditLogLink?.icon).toBeTruthy();
    });

    it('should have Profile link', () => {
      const profileLink = component['navLinks'].find((link) => link.label === 'Profile');

      expect(profileLink).toBeDefined();
      expect(profileLink?.route).toBe('/profile');
      expect(profileLink?.icon).toBeTruthy();
    });

    it('should have exactly 5 navigation links', () => {
      expect(component['navLinks'].length).toBe(5);
    });

    it('should have all links with required properties', () => {
      component['navLinks'].forEach((link) => {
        expect(link.label).toBeTruthy();
        expect(link.route).toBeTruthy();
        expect(link.icon).toBeTruthy();
      });
    });
  });

  describe('Link Order', () => {
    it('should have links in correct order', () => {
      const expectedOrder = ['Dashboard', 'Task List', 'Task Board', 'Audit Log', 'Profile'];

      component['navLinks'].forEach((link, index) => {
        expect(link.label).toBe(expectedOrder[index]);
      });
    });
  });

  describe('onLinkClick', () => {
    beforeEach(() => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
    });

    it('should emit closeSidebar on mobile when link is clicked', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const emitSpy = jest.fn();
      component.closeSidebar.subscribe(emitSpy);

      component['onLinkClick']();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should not emit closeSidebar on desktop when link is clicked', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const emitSpy = jest.fn();
      component.closeSidebar.subscribe(emitSpy);

      component['onLinkClick']();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should emit closeSidebar when width is exactly 767', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 767,
      });

      const emitSpy = jest.fn();
      component.closeSidebar.subscribe(emitSpy);

      component['onLinkClick']();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should not emit when width is exactly 768', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      const emitSpy = jest.fn();
      component.closeSidebar.subscribe(emitSpy);

      component['onLinkClick']();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('Input/Output Properties', () => {
    it('should have isOpen input', () => {
      expect(component.isOpen).toBeDefined();
    });

    it('should have closeSidebar output', () => {
      expect(component.closeSidebar).toBeDefined();
    });

    it('should accept isOpen value', () => {
      fixture.componentRef.setInput('isOpen', true);
      expect(component.isOpen()).toBe(true);

      fixture.componentRef.setInput('isOpen', false);
      expect(component.isOpen()).toBe(false);
    });
  });

  describe('Icon Paths', () => {
    it('should have valid SVG path for Dashboard icon', () => {
      const dashboardLink = component['navLinks'].find((link) => link.label === 'Dashboard');
      expect(dashboardLink?.icon).toContain('M');
      expect(dashboardLink?.icon.length).toBeGreaterThan(0);
    });

    it('should have valid SVG path for Task List icon', () => {
      const taskListLink = component['navLinks'].find((link) => link.label === 'Task List');
      expect(taskListLink?.icon).toContain('M');
      expect(taskListLink?.icon.length).toBeGreaterThan(0);
    });

    it('should have valid SVG path for Task Board icon', () => {
      const taskBoardLink = component['navLinks'].find((link) => link.label === 'Task Board');
      expect(taskBoardLink?.icon).toContain('M');
      expect(taskBoardLink?.icon.length).toBeGreaterThan(0);
    });

    it('should have valid SVG path for Audit Log icon', () => {
      const auditLogLink = component['navLinks'].find((link) => link.label === 'Audit Log');
      expect(auditLogLink?.icon).toContain('M');
      expect(auditLogLink?.icon.length).toBeGreaterThan(0);
    });

    it('should have valid SVG path for Profile icon', () => {
      const profileLink = component['navLinks'].find((link) => link.label === 'Profile');
      expect(profileLink?.icon).toContain('M');
      expect(profileLink?.icon.length).toBeGreaterThan(0);
    });

    it('should have unique icons for each link', () => {
      const icons = component['navLinks'].map((link) => link.icon);
      const uniqueIcons = new Set(icons);
      expect(uniqueIcons.size).toBe(icons.length);
    });
  });

  describe('Route Paths', () => {
    it('should have all routes starting with /', () => {
      component['navLinks'].forEach((link) => {
        expect(link.route.startsWith('/')).toBe(true);
      });
    });

    it('should have unique routes', () => {
      const routes = component['navLinks'].map((link) => link.route);
      const uniqueRoutes = new Set(routes);
      expect(uniqueRoutes.size).toBe(routes.length);
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should emit close event on mobile devices', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      const emitSpy = jest.fn();
      component.closeSidebar.subscribe(emitSpy);

      component['onLinkClick']();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should emit close event on tablet portrait', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 600,
      });

      const emitSpy = jest.fn();
      component.closeSidebar.subscribe(emitSpy);

      component['onLinkClick']();

      expect(emitSpy).toHaveBeenCalled();
    });

    it('should not emit close event on tablet landscape', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      const emitSpy = jest.fn();
      component.closeSidebar.subscribe(emitSpy);

      component['onLinkClick']();

      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('should not emit close event on desktop', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });

      const emitSpy = jest.fn();
      component.closeSidebar.subscribe(emitSpy);

      component['onLinkClick']();

      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  describe('Integration', () => {
    it('should be standalone component', () => {
      expect(SidebarComponent).toBeDefined();
    });

    it('should have correct component metadata', () => {
      const metadata = (SidebarComponent as any).ɵcmp;
      expect(metadata).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle multiple rapid link clicks on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });

      const emitSpy = jest.fn();
      component.closeSidebar.subscribe(emitSpy);

      for (let i = 0; i < 10; i++) {
        component['onLinkClick']();
      }

      expect(emitSpy).toHaveBeenCalledTimes(10);
    });

    it('should handle window resize scenarios', () => {
      const emitSpy = jest.fn();
      component.closeSidebar.subscribe(emitSpy);

      // Start on mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });
      component['onLinkClick']();
      expect(emitSpy).toHaveBeenCalledTimes(1);

      // Resize to desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });
      component['onLinkClick']();
      expect(emitSpy).toHaveBeenCalledTimes(1);

      // Resize back to mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500,
      });
      component['onLinkClick']();
      expect(emitSpy).toHaveBeenCalledTimes(2);
    });
  });
});
