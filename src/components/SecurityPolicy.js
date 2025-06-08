import React from 'react';
import TosNavbar from './TosNavbar';

function SecurityPolicy() {
    return (
        <div className="min-h-screen w-full bg-[#21141E] text-[#FAF7FD] relative">
            <TosNavbar />
            <div className="pt-16 pb-8 flex flex-col items-center w-full">
                <div className="prose prose-pink prose-tos max-w-5xl w-full mx-auto p-4 dark:prose-invert prose-pre:m-0 prose-pre:bg-transparent prose-pre:p-0">
                    <h1 className="text-4xl font-black mb-8 text-[#FAF7FD]">T3 CHAT SECURITY POLICY</h1>
                    <div className="text-[#FAF7FD] mb-10 text-base">Last Updated: 2025-02-14</div>
                    <h2 className="text-lg font-bold mb-4 text-[#FAF7FD]">1. Introduction</h2>
                    <ul className="space-y-3 pl-2 w-full">
                        <li className="flex items-start">
                            <span className="text-[#DC749E] text-2xl leading-8 mr-3 select-none flex-shrink-0">&bull;</span>
                            <span className="text-[#F2EBFA] flex-1 max-w-5xl leading-8" style={{ wordBreak: 'break-word' }}>
                                T3 Chat is committed to ensuring the security of our users' data and our platform. This security policy outlines our practices and procedures for maintaining security.
                            </span>
                        </li>
                    </ul>
                    <h2 className="text-lg font-bold mb-4 text-[#FAF7FD]">2. Reporting Security Issues</h2>
                    <ul className="space-y-3 pl-2 w-full">
                        <li className="flex items-start">
                            <span className="text-[#DC749E] text-2xl leading-8 mr-3 select-none flex-shrink-0">&bull;</span>
                            <span className="text-[#F2EBFA] flex-1 max-w-5xl leading-8" style={{ wordBreak: 'break-word' }}>
                                We welcome security researchers, ethical hackers, and technology enthusiasts to participate in our responsible disclosure program. We provide safe harbor for security testing conducted in good faith and may offer rewards for vulnerability discoveries based on severity and potential impact.
                            </span>
                        </li>
                        <li className="flex items-start">
                            <span className="text-[#F2EBFA] flex-1 max-w-5xl leading-8" style={{ wordBreak: 'break-word' }}>
                                If you discover a security vulnerability, please report it immediately to <a href="mailto:security@t3.chat" style={{ color: '#F472B6', textDecoration: 'underline' }}>security@t3.chat</a>. Include:
                                <ul className="pl-6 mt-2 space-y-2">
                                    <li className="flex items-start">
                                        <span className="text-[#DC749E] text-xl leading-7 mr-2 select-none flex-shrink-0">&bull;</span>
                                        <span className="text-[#F2EBFA] flex-1 leading-7" style={{ wordBreak: 'break-word' }}>
                                            A detailed description of the vulnerability
                                        </span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-[#DC749E] text-xl leading-7 mr-2 select-none flex-shrink-0">&bull;</span>
                                        <span className="text-[#F2EBFA] flex-1 leading-7" style={{ wordBreak: 'break-word' }}>
                                            Clear steps to reproduce the issue
                                        </span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-[#DC749E] text-xl leading-7 mr-2 select-none flex-shrink-0">&bull;</span>
                                        <span className="text-[#F2EBFA] flex-1 leading-7" style={{ wordBreak: 'break-word' }}>
                                            Any relevant screenshots, logs, or proof-of-concept code
                                        </span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-[#DC749E] text-xl leading-7 mr-2 select-none flex-shrink-0">&bull;</span>
                                        <span className="text-[#F2EBFA] flex-1 leading-7" style={{ wordBreak: 'break-word' }}>
                                            Potential impact assessment
                                        </span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-[#DC749E] text-xl leading-7 mr-2 select-none flex-shrink-0">&bull;</span>
                                        <span className="text-[#F2EBFA] flex-1 leading-7" style={{ wordBreak: 'break-word' }}>
                                            Your contact information for follow-up
                                        </span>
                                    </li>

                                </ul>
                                We commit to:
                                <ul className="pl-6 mt-2 space-y-2">
                                    <li className="flex items-start">
                                        <span className="text-[#DC749E] text-xl leading-7 mr-2 select-none flex-shrink-0">&bull;</span>
                                        <span className="text-[#F2EBFA] flex-1 leading-7" style={{ wordBreak: 'break-word' }}>
                                            Acknowledging receipt within 1 business day
                                        </span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-[#DC749E] text-xl leading-7 mr-2 select-none flex-shrink-0">&bull;</span>
                                        <span className="text-[#F2EBFA] flex-1 leading-7" style={{ wordBreak: 'break-word' }}>
                                            Working with you to validate and resolve the issue
                                        </span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-[#DC749E] text-xl leading-7 mr-2 select-none flex-shrink-0">&bull;</span>
                                        <span className="text-[#F2EBFA] flex-1 leading-7" style={{ wordBreak: 'break-word' }}>
                                            Giving appropriate credit if desired
                                        </span>
                                    </li>

                                </ul>
                                We value the security community's contributions in keeping T3 Chat secure. All legitimate reports will be thoroughly investigated and addressed with appropriate urgency.


                            </span>
                        </li>
                    </ul>
                    <h2 className="text-lg font-bold mb-4 text-[#FAF7FD]">3.  Our Security Practices</h2>
                    <ul className="space-y-3 pl-2 w-full">
                        <li className="flex items-start">
                            <span className="text-[#DC749E] text-2xl leading-8 mr-3 select-none flex-shrink-0">&bull;</span>
                            <span className="text-[#F2EBFA] flex-1 max-w-5xl leading-8" style={{ wordBreak: 'break-word' }}>
                                3.1. Data Protection
                                <ul className="pl-6 mt-2 space-y-2">
                                    <li className="flex items-start">
                                        <span className="text-[#DC749E] text-xl leading-7 mr-2 select-none flex-shrink-0">&bull;</span>
                                        <span className="text-[#F2EBFA] flex-1 leading-7" style={{ wordBreak: 'break-word' }}>
                                            All data is encrypted in transit using TLS
                                        </span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-[#DC749E] text-xl leading-7 mr-2 select-none flex-shrink-0">&bull;</span>
                                        <span className="text-[#F2EBFA] flex-1 leading-7" style={{ wordBreak: 'break-word' }}>
                                            We collect only essential user information, adhering to data minimization principles
                                        </span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-[#DC749E] text-xl leading-7 mr-2 select-none flex-shrink-0">&bull;</span>
                                        <span className="text-[#F2EBFA] flex-1 leading-7" style={{ wordBreak: 'break-word' }}>
                                            User data is stored securely with appropriate access controls
                                        </span>
                                    </li>

                                </ul>
                                3.2. Authentication
                                <ul className="pl-6 mt-2 space-y-2">
                                    <li className="flex items-start">
                                        <span className="text-[#DC749E] text-xl leading-7 mr-2 select-none flex-shrink-0">&bull;</span>
                                        <span className="text-[#F2EBFA] flex-1 leading-7" style={{ wordBreak: 'break-word' }}>
                                            Industry-standard authentication protocols
                                        </span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-[#DC749E] text-xl leading-7 mr-2 select-none flex-shrink-0">&bull;</span>
                                        <span className="text-[#F2EBFA] flex-1 leading-7" style={{ wordBreak: 'break-word' }}>
                                            Multi-factor authentication support
                                        </span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-[#DC749E] text-xl leading-7 mr-2 select-none flex-shrink-0">&bull;</span>
                                        <span className="text-[#F2EBFA] flex-1 leading-7" style={{ wordBreak: 'break-word' }}>
                                            Secure session management
                                        </span>
                                    </li>
                                </ul>
                                3.3. Infrastructure
                                <ul className="pl-6 mt-2 space-y-2">
                                    <li className="flex items-start">
                                        <span className="text-[#DC749E] text-xl leading-7 mr-2 select-none flex-shrink-0">&bull;</span>
                                        <span className="text-[#F2EBFA] flex-1 leading-7" style={{ wordBreak: 'break-word' }}>
                                            Regular security audits and assessments
                                        </span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-[#DC749E] text-xl leading-7 mr-2 select-none flex-shrink-0">&bull;</span>
                                        <span className="text-[#F2EBFA] flex-1 leading-7" style={{ wordBreak: 'break-word' }}>
                                            Regular security updates and patches
                                        </span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-[#DC749E] text-xl leading-7 mr-2 select-none flex-shrink-0">&bull;</span>
                                        <span className="text-[#F2EBFA] flex-1 leading-7" style={{ wordBreak: 'break-word' }}>
                                            Monitoring for suspicious activities
                                        </span>
                                    </li>
                                </ul>

                            </span>
                        </li>
                    </ul>
                    <h2 className="text-lg font-bold mb-4 text-[#FAF7FD]">4. User Responsibilities
                    </h2>
                    <ul className="space-y-3 pl-2 w-full">
                        <li className="flex items-start">
                            <span className="text-[#F2EBFA] flex-1 max-w-5xl leading-8" style={{ wordBreak: 'break-word' }}>
                                To help maintain the security of your account:
                                <ol className="pl-6 mt-2 space-y-2 list-decimal">
                                    <li className="flex items-start">
                                        <span className="text-[#DC749E] text-xl leading-7 mr-2 select-none flex-shrink-0">1.</span>
                                        <span className="text-[#F2EBFA] flex-1 leading-7" style={{ wordBreak: 'break-word' }}>
                                            Use secure authentication providers you trust
                                        </span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-[#DC749E] text-xl leading-7 mr-2 select-none flex-shrink-0">2.</span>
                                        <span className="text-[#F2EBFA] flex-1 leading-7" style={{ wordBreak: 'break-word' }}>
                                            Keep your OAuth provider account secure with strong passwords and two-factor authentication
                                        </span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-[#DC749E] text-xl leading-7 mr-2 select-none flex-shrink-0">3.</span>
                                        <span className="text-[#F2EBFA] flex-1 leading-7" style={{ wordBreak: 'break-word' }}>
                                            Never share access to your authorized T3 Chat sessions
                                        </span>
                                    </li>
                                    <li className="flex items-start">
                                        <span className="text-[#DC749E] text-xl leading-7 mr-2 select-none flex-shrink-0">4.</span>
                                        <span className="text-[#F2EBFA] flex-1 leading-7" style={{ wordBreak: 'break-word' }}>
                                            Report suspicious activities immediately
                                        </span>
                                    </li>
                                </ol>
                            </span>
                        </li>
                    </ul>
                    <h2 className="text-lg font-bold mb-4 text-[#FAF7FD]">5. Updates to This Policy</h2>
                    <ul className="space-y-3 pl-2 w-full">
                        <li className="flex items-start">
                            <span className="text-[#F2EBFA] flex-1 max-w-5xl leading-8" style={{ wordBreak: 'break-word' }}>
                                We may update this Security Policy from time to time. When we do, we will revise the "Last Updated" date at the top of this page.
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default SecurityPolicy; 