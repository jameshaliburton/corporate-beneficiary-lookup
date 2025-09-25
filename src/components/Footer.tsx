"use client";

import React from 'react';

export function Footer() {
  return (
    <footer className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p className="text-[10px] text-gray-400 text-center mt-4">
            This site may use Google AI to assist with ownership analysis. See Google's{' '}
            <a
              href="https://policies.google.com/privacy"
              className="underline hover:text-gray-600"
              target="_blank" 
              rel="noopener noreferrer"
            >
              Privacy Policy
            </a>{' '}
            and{' '}
            <a
              href="https://policies.google.com/terms"
              className="underline hover:text-gray-600"
              target="_blank" 
              rel="noopener noreferrer"
            >
              Terms of Service
            </a>.
          </p>
        </div>
      </div>
    </footer>
  );
}
