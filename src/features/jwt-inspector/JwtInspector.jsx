import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  ShieldAlert,
  KeyRound,
  Copy,
  Check,
  Trash2,
  Sparkles,
  AlertCircle,
  FileCode,
  Calendar,
  Clock,
  User,
  Globe,
  Tag,
  Hash,
} from 'lucide-react';
import { parseJwt, SAMPLE_JWT } from '../../lib/jwtUtils';

export function JwtInspector() {
  const [tokenInput, setTokenInput] = useState('');
  const [copiedSection, setCopiedSection] = useState(null); // 'header' | 'payload' | 'signature' | 'token'
  const [copyError, setCopyError] = useState(null);

  const copiedTimeoutRef = useRef(null);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
    };
  }, []);

  // Parse token dynamically or derive error state
  const parseResult = useMemo(() => {
    const trimmed = tokenInput.trim();
    if (!trimmed) {
      return { isEmpty: true, data: null, error: null };
    }
    try {
      const parsed = parseJwt(trimmed);
      return { isEmpty: false, data: parsed, error: null };
    } catch (err) {
      return {
        isEmpty: false,
        data: null,
        error: err instanceof Error ? err.message : 'Invalid token structure',
      };
    }
  }, [tokenInput]);

  // Load sample token
  const handleLoadSample = useCallback(() => {
    setTokenInput(SAMPLE_JWT);
    setCopyError(null);
  }, []);

  // Clear token input
  const handleClear = useCallback(() => {
    setTokenInput('');
    setCopyError(null);
    setCopiedSection(null);
  }, []);

  // Generic copy helper
  const handleCopy = useCallback(async (text, sectionName) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(sectionName);
      setCopyError(null);
      if (copiedTimeoutRef.current) {
        clearTimeout(copiedTimeoutRef.current);
      }
      copiedTimeoutRef.current = setTimeout(() => {
        setCopiedSection(null);
      }, 2000);
    } catch (err) {
      setCopyError(
        err instanceof Error
          ? `Clipboard copy failed: ${err.message}`
          : 'Failed to copy to clipboard. Please check browser permissions.'
      );
    }
  }, []);

  const { data: jwtData, error: parseError, isEmpty } = parseResult;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              JWT Inspector
            </h1>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Active Tool
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Decode and inspect JSON Web Tokens locally using strict UTF-8 Base64URL parsing. Zero
            server calls.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLoadSample}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Load Sample Token</span>
        </button>
      </div>

      {/* Mandatory Persistent Security Warning Banner */}
      <div
        role="alert"
        aria-live="polite"
        className="rounded-xl border border-amber-300 bg-amber-50/80 p-4 dark:border-amber-900/60 dark:bg-amber-950/40 text-amber-950 dark:text-amber-200 space-y-1.5 shadow-xs"
      >
        <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm">
          <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            Decoding a JWT does not verify its signature or prove that the token is authentic.
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-amber-900/90 dark:text-amber-300/90 pl-6">
          Client-side inspection extracts and displays Base64URL-encoded headers and claims directly
          in your browser. It does not cryptographically validate signatures or confirm whether the
          token was issued by a trusted identity provider.
        </p>
      </div>

      {/* Token Input Card */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between text-xs">
          <label
            htmlFor="jwt-token-input"
            className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
          >
            <KeyRound className="w-4 h-4 text-blue-500" />
            <span>Encoded JWT Token</span>
          </label>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            <span>{tokenInput.length} characters</span>
          </div>
        </div>

        <div className="relative">
          <textarea
            id="jwt-token-input"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Paste your compact JWT here (e.g. eyJhbGciOi...eyJzdWIiOi...c2lnbmF0dXJl)..."
            spellCheck="false"
            aria-describedby={parseError ? 'jwt-error-message' : undefined}
            className={`w-full h-32 p-3 font-mono text-xs rounded-xl border bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 transition-all resize-y break-all ${
              parseError
                ? 'border-red-400 focus:ring-red-500 dark:border-red-600'
                : 'border-slate-300 dark:border-slate-700 focus:ring-blue-500'
            }`}
          />
        </div>

        {/* Input Action Controls */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClear}
              disabled={!tokenInput}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Token</span>
            </button>
          </div>

          {tokenInput && (
            <button
              type="button"
              onClick={() => handleCopy(tokenInput, 'token')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              {copiedSection === 'token' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 dark:text-emerald-400">Copied Token</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Raw Token</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Error Alert Box */}
        {parseError && (
          <div
            id="jwt-error-message"
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 space-y-1 animate-in fade-in duration-150"
          >
            <div className="flex items-center gap-1.5 font-semibold text-red-900 dark:text-red-200">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              <span>Token Structure Error</span>
            </div>
            <p className="font-mono text-[11px] break-words pl-5">{parseError}</p>
          </div>
        )}

        {/* Clipboard Error Alert Box */}
        {copyError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            <p>{copyError}</p>
          </div>
        )}
      </div>

      {/* Decoded Output Area (Only shown when valid token data exists) */}
      {jwtData && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Standard Claims Summary Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Tag className="w-4 h-4 text-blue-500" />
                <span>Standard Claims Inspection</span>
              </h2>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">RFC 7519</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {/* Expiration claim (exp) */}
              <div className="rounded-lg p-2.5 border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Expiration (exp)</span>
                  </span>
                  {jwtData.claims.exp && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        jwtData.claims.exp.isExpired
                          ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {jwtData.claims.exp.isExpired ? 'Expired' : 'Active'}
                    </span>
                  )}
                </div>
                {jwtData.claims.exp ? (
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {jwtData.claims.exp.dateString}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      Timestamp: {jwtData.claims.exp.timestamp}
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-400 text-[11px]">Not present in token</span>
                )}
              </div>

              {/* Issued At claim (iat) */}
              <div className="rounded-lg p-2.5 border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40 space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>Issued At (iat)</span>
                </span>
                {jwtData.claims.iat ? (
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {jwtData.claims.iat.dateString}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      Timestamp: {jwtData.claims.iat.timestamp}
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-400 text-[11px]">Not present in token</span>
                )}
              </div>

              {/* Not Before claim (nbf) */}
              <div className="rounded-lg p-2.5 border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Not Before (nbf)</span>
                  </span>
                  {jwtData.claims.nbf && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        jwtData.claims.nbf.isNotYetValid
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {jwtData.claims.nbf.isNotYetValid ? 'Not Yet Valid' : 'Active'}
                    </span>
                  )}
                </div>
                {jwtData.claims.nbf ? (
                  <div>
                    <div className="font-medium text-slate-900 dark:text-white">
                      {jwtData.claims.nbf.dateString}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500">
                      Timestamp: {jwtData.claims.nbf.timestamp}
                    </div>
                  </div>
                ) : (
                  <span className="text-slate-400 text-[11px]">Not present in token</span>
                )}
              </div>

              {/* Issuer (iss) */}
              <div className="rounded-lg p-2.5 border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40 space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <span>Issuer (iss)</span>
                </span>
                <div className="font-mono text-[11px] text-slate-900 dark:text-white truncate">
                  {jwtData.claims.iss || (
                    <span className="text-slate-400 font-sans">Not present</span>
                  )}
                </div>
              </div>

              {/* Subject (sub) */}
              <div className="rounded-lg p-2.5 border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40 space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Subject (sub)</span>
                </span>
                <div className="font-mono text-[11px] text-slate-900 dark:text-white truncate">
                  {jwtData.claims.sub || (
                    <span className="text-slate-400 font-sans">Not present</span>
                  )}
                </div>
              </div>

              {/* JWT ID (jti) */}
              <div className="rounded-lg p-2.5 border border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-800/40 space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-slate-500" />
                  <span>Token ID (jti)</span>
                </span>
                <div className="font-mono text-[11px] text-slate-900 dark:text-white truncate">
                  {jwtData.claims.jti || (
                    <span className="text-slate-400 font-sans">Not present</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dual Panel: Header & Payload JSON */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Header Section */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-red-500" />
                    <span>Header: Algorithm & Token Type</span>
                  </span>
                  {jwtData.header.alg && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      alg: {jwtData.header.alg}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(jwtData.headerRaw, 'header')}
                  aria-label="Copy decoded header JSON"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {copiedSection === 'header' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                value={jwtData.headerRaw}
                readOnly
                aria-label="Decoded JWT header JSON"
                className="w-full h-56 p-3.5 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Payload Section */}
            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-purple-500" />
                    <span>Payload: Data & Claims</span>
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {Object.keys(jwtData.payload).length} keys
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(jwtData.payloadRaw, 'payload')}
                  aria-label="Copy decoded payload JSON"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {copiedSection === 'payload' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>

              <textarea
                value={jwtData.payloadRaw}
                readOnly
                aria-label="Decoded JWT payload JSON"
                className="w-full h-56 p-3.5 font-mono text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Signature Segment Section */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-blue-500" />
                  <span>Signature Segment (Unverified)</span>
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                  Cryptographic verification not performed
                </span>
              </div>

              {jwtData.signature && (
                <button
                  type="button"
                  onClick={() => handleCopy(jwtData.signature, 'signature')}
                  aria-label="Copy encoded signature segment"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 px-2 py-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {copiedSection === 'signature' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Signature</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <p className="font-mono text-xs p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 break-all select-all">
              {jwtData.signature || '(Unsigned token — signature segment is empty)'}
            </p>
          </div>
        </div>
      )}

      {/* Empty State when no token entered */}
      {isEmpty && (
        <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Paste a compact JWT token above or click &quot;Load Sample Token&quot; to inspect its
            headers and claims.
          </p>
        </div>
      )}
    </div>
  );
}

export default JwtInspector;
