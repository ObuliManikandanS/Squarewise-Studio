import type {NextConfig} from 'next';
const config:NextConfig={serverExternalPackages:['pdfkit','pg','better-auth'],outputFileTracingIncludes:{'/api/**':['./public/fonts/**/*','./public/maps/*.geojson']},async headers(){return [{source:'/:path*',headers:[{key:'X-Content-Type-Options',value:'nosniff'},{key:'X-Frame-Options',value:'DENY'},{key:'Referrer-Policy',value:'strict-origin-when-cross-origin'}]},{source:'/api/:path*',headers:[{key:'Cache-Control',value:'private, no-store'}]}]}};
export default config;
