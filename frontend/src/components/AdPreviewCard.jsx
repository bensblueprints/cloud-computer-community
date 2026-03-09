import React from 'react';

const CTA_LABELS = {
  LEARN_MORE: 'Learn More',
  SHOP_NOW: 'Shop Now',
  SIGN_UP: 'Sign Up',
  DOWNLOAD: 'Download',
  BOOK_TRAVEL: 'Book Now',
  CONTACT_US: 'Contact Us',
  GET_OFFER: 'Get Offer',
  GET_QUOTE: 'Get Quote',
  SUBSCRIBE: 'Subscribe',
  APPLY_NOW: 'Apply Now',
  WATCH_MORE: 'Watch More',
  ORDER_NOW: 'Order Now',
};

export default function AdPreviewCard({ pageName, pageImage, bodyText, imageUrl, headline, description, linkUrl, ctaType }) {
  return (
    <div className="max-w-md bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      {/* Page header */}
      <div className="flex items-center gap-2 p-3">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
          {pageImage ? (
            <img src={pageImage} alt={pageName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-blue-600 font-bold text-sm">{(pageName || 'P')[0]}</span>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{pageName || 'Your Page'}</p>
          <p className="text-xs text-gray-500">Sponsored</p>
        </div>
      </div>

      {/* Body text */}
      {bodyText && (
        <div className="px-3 pb-2">
          <p className="text-sm text-gray-800 whitespace-pre-wrap">{bodyText}</p>
        </div>
      )}

      {/* Image */}
      <div className="aspect-[1.91/1] bg-gray-100">
        {imageUrl ? (
          <img src={imageUrl} alt="Ad creative" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Link card */}
      <div className="border-t border-gray-200 bg-gray-50 p-3">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 mr-3">
            {linkUrl && <p className="text-xs text-gray-500 uppercase truncate">{new URL(linkUrl).hostname}</p>}
            <p className="text-sm font-semibold text-gray-900 truncate">{headline || 'Headline'}</p>
            {description && <p className="text-xs text-gray-500 truncate">{description}</p>}
          </div>
          <button className="flex-shrink-0 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm font-semibold text-gray-700 transition-colors">
            {CTA_LABELS[ctaType] || CTA_LABELS.LEARN_MORE}
          </button>
        </div>
      </div>
    </div>
  );
}
