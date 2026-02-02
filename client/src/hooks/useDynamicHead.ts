/**
 * useDynamicHead Hook
 * 
 * Gerencia dinamicamente o título da página e o favicon
 * baseado na configuração da comunidade.
 * 
 * Usado para white-label: cada comunidade pode ter seu próprio
 * favicon, título e meta tags.
 */

import { useEffect } from 'react';
import { useCommunity } from '../context/CommunityContext';

interface DynamicHeadOptions {
  /** Sufixo para o título (ex: "Feed" -> "Magazine MGT | Feed") */
  titleSuffix?: string;
  /** Override completo do título */
  titleOverride?: string;
}

export function useDynamicHead(options: DynamicHeadOptions = {}) {
  const { config } = useCommunity();
  const { titleSuffix, titleOverride } = options;

  useEffect(() => {
    // Atualizar título da página
    if (titleOverride) {
      document.title = titleOverride;
    } else if (titleSuffix) {
      document.title = `${config.name} | ${titleSuffix}`;
    } else {
      document.title = config.name;
    }

    // Atualizar favicon
    if (config.faviconUrl) {
      updateFavicon(config.faviconUrl);
    }

    // Atualizar meta tags OG
    updateMetaTag('og:title', document.title);
    updateMetaTag('og:site_name', config.name);
    
    if (config.ogImageUrl) {
      updateMetaTag('og:image', config.ogImageUrl);
    }
    
    if (config.slogan) {
      updateMetaTag('og:description', config.slogan);
      updateMetaTag('description', config.slogan);
    }

  }, [config.name, config.faviconUrl, config.ogImageUrl, config.slogan, titleSuffix, titleOverride]);
}

/**
 * Atualiza o favicon dinamicamente
 */
function updateFavicon(url: string) {
  // Remover favicons existentes
  const existingLinks = document.querySelectorAll("link[rel*='icon']");
  existingLinks.forEach(link => link.remove());

  // Criar novo favicon
  const link = document.createElement('link');
  link.rel = 'icon';
  link.type = url.endsWith('.ico') ? 'image/x-icon' : 'image/png';
  link.href = url;
  document.head.appendChild(link);

  // Apple touch icon
  const appleLink = document.createElement('link');
  appleLink.rel = 'apple-touch-icon';
  appleLink.href = url;
  document.head.appendChild(appleLink);
}

/**
 * Atualiza ou cria uma meta tag
 */
function updateMetaTag(name: string, content: string) {
  // Tentar encontrar por property (og:*) ou name
  let meta = document.querySelector(`meta[property="${name}"]`) as HTMLMetaElement;
  
  if (!meta) {
    meta = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement;
  }

  if (meta) {
    meta.content = content;
  } else {
    // Criar nova meta tag
    meta = document.createElement('meta');
    if (name.startsWith('og:')) {
      meta.setAttribute('property', name);
    } else {
      meta.setAttribute('name', name);
    }
    meta.content = content;
    document.head.appendChild(meta);
  }
}

export default useDynamicHead;
