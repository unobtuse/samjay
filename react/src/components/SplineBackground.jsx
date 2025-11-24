import React, { useEffect, useRef } from 'react';
import { Application } from '@splinetool/runtime';

const SplineBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const app = new Application(canvasRef.current);
    app.load(`${import.meta.env.BASE_URL}assets/scene.splinecode`).then(() => {
      // Attempt to set theme colors once loaded
      // Based on the template, these variable names might exist
      // You can check available variables with: console.log(app.getVariables());
      
      try {
        // Try to set variables if they exist (common in this template)
        app.setVariable('colorNear', '#FF2A00'); // Sam Jay Red
        app.setVariable('colorFar', '#050505');  // Sam Jay Black
        
        // Also try finding objects directly if variables don't work
        // This is a common object name in the gradient template
        const gradientObj = app.findObjectByName('Gradient');
        if (gradientObj) {
           // gradientObj.material.uniforms... (complex to edit directly without API)
        }
      } catch (e) {
        console.warn('Could not set Spline variables:', e);
      }
    });

    return () => {
      app.dispose();
    };
  }, []);

  return (
    <div id="spline-bg" className="fixed inset-0 w-full h-full z-[-50] opacity-50 pointer-events-none" style={{ filter: 'hue-rotate(128deg) saturate(1.2)' }}>
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export default SplineBackground;
