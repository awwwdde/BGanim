import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

const SphereBackground = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    // Создание сцены
    const scene = new THREE.Scene();

    // Создание камеры
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 3;

    // Создание рендера
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Создание источников света
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(5, 5, 5);
    scene.add(pointLight);

    // Шейдерный материал
    const vertexShader = `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float time;

      // Функция фрактального шума
      float hash(float n) { return fract(sin(n) * 43758.5453123); }
      float noise(vec3 x) {
        vec3 p = floor(x);
        vec3 f = fract(x);
        f = f*f*(3.0-2.0*f);
        float n = p.x + p.y*57.0 + 113.0*p.z;
        return mix(mix(mix( hash(n+  0.0), hash(n+  1.0),f.x),
                       mix( hash(n+ 57.0), hash(n+ 58.0),f.x),f.y),
                   mix(mix( hash(n+113.0), hash(n+114.0),f.x),
                       mix( hash(n+170.0), hash(n+171.0),f.x),f.y),f.z);
      }

      void main() {
        vUv = uv;
        vNormal = normal;
        vPosition = position;

        // Дислокация вершин для создания эффекта скульптинга
        float displacement = noise(position * 3.0 + time) * 0.2;
        vec3 newPosition = position + normal * displacement;

        gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
      }
    `;

    const fragmentShader = `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float time;

      void main() {
        // Освещение
        vec3 lightDir = normalize(vec3(0.5, 0.5, 1.0));
        float lightIntensity = max(dot(vNormal, lightDir), 0.0) + 0.5;

        // Градиент цвета на основе высоты
        float heightFactor = (vPosition.y + 1.0) / 2.0;
        vec3 baseColor = mix(vec3(0.2, 0.3, 0.5), vec3(0.8, 0.9, 1.0), heightFactor);
        vec3 color = baseColor * lightIntensity;

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        time: { value: 0 }
      },
      transparent: true,
    });

    // Создание геометрии сферы
    const geometry = new THREE.SphereGeometry(1.5, 96, 96);
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Анимация
    const animate = () => {
      requestAnimationFrame(animate);

      // Обновление времени для анимации
      material.uniforms.time.value += 0.01;

      // Вращение сферы для более динамичного эффекта
      sphere.rotation.y += 0.005;

      renderer.render(scene, camera);
    };

    animate();

    // Обработчик изменения размера окна
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    // Очистка на размонтировании
    return () => {
      window.removeEventListener('resize', handleResize);
      mountRef.current.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={mountRef} style={styles.container} />;
};

const styles = {
  container: {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    height: ' 100%',
  },
};

export default SphereBackground;