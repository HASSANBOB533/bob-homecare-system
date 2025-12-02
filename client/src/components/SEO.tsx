import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'service';
  locale?: 'en' | 'ar';
  noindex?: boolean;
}

const defaultMeta = {
  title: 'BOB Home Care - Professional Cleaning Services in Egypt',
  description: 'BOB Home Care offers professional cleaning services with international hospitality standards. Airbnb cleaning, deep cleaning, regular maintenance, and more. Licensed, insured, and eco-friendly.',
  keywords: 'home cleaning, professional cleaning, Airbnb cleaning, deep cleaning, house cleaning Egypt, cleaning services, eco-friendly cleaning, licensed cleaning company',
  image: '/og-image.jpg',
  url: 'https://bobhomecare.com',
};

export function SEO({
  title = defaultMeta.title,
  description = defaultMeta.description,
  keywords = defaultMeta.keywords,
  image = defaultMeta.image,
  url = defaultMeta.url,
  type = 'website',
  locale = 'en',
  noindex = false,
}: SEOProps) {
  const fullTitle = title === defaultMeta.title ? title : `${title} | BOB Home Care`;
  const fullImageUrl = image.startsWith('http') ? image : `${url}${image}`;
  const canonicalUrl = url;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      
      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Language & Locale */}
      <html lang={locale} dir={locale === 'ar' ? 'rtl' : 'ltr'} />
      <meta property="og:locale" content={locale === 'ar' ? 'ar_EG' : 'en_US'} />
      {locale === 'ar' && <meta property="og:locale:alternate" content="en_US" />}
      {locale === 'en' && <meta property="og:locale:alternate" content="ar_EG" />}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="BOB Home Care" />
      
      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={fullTitle} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={fullImageUrl} />
      
      {/* Additional Meta Tags */}
      <meta name="author" content="BOB Home Care" />
      <meta name="copyright" content="BOB Home Care" />
      <meta name="theme-color" content="#10b981" />
      
      {/* Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      <meta name="format-detection" content="telephone=yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      <meta name="apple-mobile-web-app-title" content="BOB Home Care" />
    </Helmet>
  );
}

// Structured Data (JSON-LD) Component
interface StructuredDataProps {
  type: 'Organization' | 'LocalBusiness' | 'Service' | 'BreadcrumbList' | 'FAQPage';
  data: Record<string, any>;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}

// Organization Schema for Homepage
export function OrganizationSchema() {
  return (
    <StructuredData
      type="Organization"
      data={{
        name: 'BOB Home Care',
        description: 'Professional home cleaning services with international hospitality standards',
        url: 'https://bobhomecare.com',
        logo: 'https://bobhomecare.com/logo.png',
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+20-XXX-XXX-XXXX',
          contactType: 'customer service',
          areaServed: 'EG',
          availableLanguage: ['en', 'ar'],
        },
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'EG',
        },
        sameAs: [
          // Add social media links here
        ],
      }}
    />
  );
}

// Local Business Schema
export function LocalBusinessSchema() {
  return (
    <StructuredData
      type="LocalBusiness"
      data={{
        '@type': 'LocalBusiness',
        name: 'BOB Home Care',
        description: 'Professional home cleaning services',
        image: 'https://bobhomecare.com/og-image.jpg',
        priceRange: '$$',
        address: {
          '@type': 'PostalAddress',
          addressCountry: 'EG',
        },
        geo: {
          '@type': 'GeoCoordinates',
          // Add coordinates if available
        },
        openingHoursSpecification: {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
          opens: '09:00',
          closes: '20:00',
        },
      }}
    />
  );
}

// Service Schema
export function ServiceSchema({ serviceName, description, price }: { serviceName: string; description: string; price?: string }) {
  return (
    <StructuredData
      type="Service"
      data={{
        name: serviceName,
        description: description,
        provider: {
          '@type': 'Organization',
          name: 'BOB Home Care',
        },
        areaServed: {
          '@type': 'Country',
          name: 'Egypt',
        },
        ...(price && {
          offers: {
            '@type': 'Offer',
            price: price,
            priceCurrency: 'EGP',
          },
        }),
      }}
    />
  );
}
