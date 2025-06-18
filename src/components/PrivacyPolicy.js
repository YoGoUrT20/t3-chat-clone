import React, { useEffect } from 'react';
import LiquidGlassButton from './LiquidGlassButton';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import SettingsTabs from './ui/TosTabs';

const tabs = ['Terms of Service', 'Privacy Policy', 'Security Policy', 'FAQ & Support'];
const tabRoutes = ['/terms-of-service', '/privacy-policy', '/security-policy', '/faq-support'];

function PrivacyPolicy() {
    useEffect(() => {
        if (window.location.hash === '#contact') {
            const el = document.getElementById('policy-contact');
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, []);
    const navigate = useNavigate();
    const location = useLocation();
    const activeIndex = tabRoutes.findIndex(route => location.pathname.startsWith(route));
    return (
        <div className='w-full main-bg'>
            <div className='flex justify-center items-center w-full min-h-screen'>
                <div className='fixed top-4 left-4 z-20 sm:top-6 sm:left-6'>
                    <LiquidGlassButton
                        onClick={() => navigate('/')}
                        icon={<ArrowLeft size={18} />}
                        text={'Back'}
                        variant={'rect'}
                    />
                </div>
                <div className='w-full max-w-[1200px] flex flex-col md:flex-row bg-transparent rounded-xl shadow-none border-none min-h-[500px]'>
                    <div className='flex flex-col items-center justify-start pt-8 px-4 md:pt-16 md:px-10 bg-transparent relative min-w-0 md:min-w-[220px]' style={{minHeight:220}} />
                    <div className='flex-1 flex flex-col items-start justify-start pt-6 pl-2 pr-2 md:pt-10 md:pl-8 md:pr-8 relative w-full'>
                        <SettingsTabs
                            tabs={tabs}
                            activeIndex={activeIndex}
                            setActiveIndex={i => navigate(tabRoutes[i])}
                        />
                        <div className='w-full mt-4 md:mt-8 min-h-[200px] md:min-h-[300px] min-w-0 md:min-w-[350px] rounded-xl shadow border border-[#ececec] dark:border-[#232228] flex flex-col transition-none bg-transparent'>
                            <style>{`
                                ::-webkit-scrollbar-thumb {
                                    background: #483A44;
                                    border-radius: 0;
                                    border: none;
                                }
                                ::-webkit-scrollbar-track {
                                    background: #21141E;
                                    margin: 0;
                                    border: none;
                                }
                                ::-webkit-scrollbar {
                                    width: 8px;
                                    background: #21141E;
                                    margin: 0;
                                }
                                ::-webkit-scrollbar-button {
                                    display: none;
                                    height: 0;
                                    width: 0;
                                }
                                html {
                                    scrollbar-color: #483A44 #21141E;
                                }
                            `}</style>
                            <div className='prose prose-pink prose-tos max-w-full md:max-w-5xl w-full mx-auto p-2 md:p-4 dark:prose-invert prose-pre:m-0 prose-pre:bg-transparent prose-pre:p-0'>
                                <h1 className='text-2xl md:text-4xl font-black mb-6 md:mb-8 text-[#FAF7FD]'>PRIVACY POLICY</h1>
                                <div className='text-[#FAF7FD] mb-2 text-sm md:text-base'>Last Updated: 2025-06-18</div>
                                <div className='text-[#FAF7FD] mb-6 md:mb-10 text-sm md:text-base'>Effective Date: 2025-06-18</div>
                                <h2 className='text-base md:text-lg font-bold mb-3 md:mb-4 text-[#FAF7FD]'>1. Introduction</h2>
                                <ul className='space-y-2 md:space-y-3 pl-2 w-full'>
                                    <li className='flex items-start'>
                                        <span className='text-[#DC749E] text-xl md:text-2xl leading-8 mr-2 md:mr-3 select-none flex-shrink-0'>&bull;</span>
                                        <span className='text-[#F2EBFA] flex-1 max-w-full md:max-w-5xl leading-7 md:leading-8' style={{ wordBreak: 'break-word' }}>
                                            This privacy policy explains how we collect, use, and protect your personal information when you use this website (the 'Site'). By using the Site, you agree to the terms of this policy. If you have any questions, please contact us at work@minefloat.com.
                                        </span>
                                    </li>
                                </ul>
                                <h2 className='text-base md:text-lg font-bold mb-3 md:mb-4 text-[#FAF7FD]'>2. Information We Collect</h2>
                                <ul className='space-y-2 md:space-y-3 pl-2 w-full'>
                                    <li className='flex items-start'>
                                        <span className='text-[#DC749E] text-xl md:text-2xl leading-8 mr-2 md:mr-3 select-none flex-shrink-0'>&bull;</span>
                                        <span className='text-[#F2EBFA] flex-1 max-w-full md:max-w-5xl leading-7 md:leading-8' style={{ wordBreak: 'break-word' }}>
                                            We may collect information you provide directly to us, such as your name, email address, or any other information you choose to provide when contacting us.
                                        </span>
                                    </li>
                                    <li className='flex items-start'>
                                        <span className='text-[#DC749E] text-xl md:text-2xl leading-8 mr-2 md:mr-3 select-none flex-shrink-0'>&bull;</span>
                                        <span className='text-[#F2EBFA] flex-1 max-w-full md:max-w-5xl leading-7 md:leading-8' style={{ wordBreak: 'break-word' }}>
                                            We may also collect basic technical information automatically, such as your IP address, browser type, and pages you visit, to help us maintain and improve the Site.
                                        </span>
                                    </li>
                                </ul>
                                <h2 className='text-base md:text-lg font-bold mb-3 md:mb-4 text-[#FAF7FD]'>3. How We Use Your Information</h2>
                                <ul className='space-y-2 md:space-y-3 pl-2 w-full'>
                                    <li className='flex items-start'>
                                        <span className='text-[#F2EBFA] flex-1 max-w-full md:max-w-5xl leading-7 md:leading-8' style={{ wordBreak: 'break-word' }}>
                                            We use your information to operate and improve the Site, respond to your inquiries, and communicate with you if needed.
                                        </span>
                                    </li>
                                </ul>
                                <h2 className='text-base md:text-lg font-bold mb-3 md:mb-4 text-[#FAF7FD]'>4. Sharing Your Information</h2>
                                <ul className='space-y-2 md:space-y-3 pl-2 w-full'>
                                    <li className='flex items-start'>
                                        <span className='text-[#F2EBFA] flex-1 max-w-full md:max-w-5xl leading-7 md:leading-8' style={{ wordBreak: 'break-word' }}>
                                            We do not sell or rent your personal information. We may share your information if required by law or to protect our rights.
                                        </span>
                                    </li>
                                </ul>
                                <h2 className='text-base md:text-lg font-bold mb-3 md:mb-4 text-[#FAF7FD]'>5. Cookies</h2>
                                <div className='mb-4 md:mb-6 text-[#F2EBFA]'>
                                    <p className='text-[#F2EBFA]'>We may use cookies to help the Site function properly. You can disable cookies in your browser settings, but some features of the Site may not work as intended.</p>
                                </div>
                                <h2 className='text-base md:text-lg font-bold mb-3 md:mb-4 text-[#FAF7FD]'>6. Security</h2>
                                <div className='mb-4 md:mb-6 text-[#F2EBFA]'>
                                    <p className='text-[#F2EBFA]'>We take reasonable steps to protect your information, but no method of transmission over the internet is completely secure.</p>
                                </div>
                                <h2 className='text-base md:text-lg font-bold mb-3 md:mb-4 text-[#FAF7FD]'>7. Children&apos;s Privacy</h2>
                                <div className='mb-4 md:mb-6 text-[#F2EBFA]'>
                                    <p className='text-[#F2EBFA]'>The Site is not intended for children under 13. We do not knowingly collect personal information from children under 13.</p>
                                </div>
                                <h2 className='text-base md:text-lg font-bold mb-3 md:mb-4 text-[#FAF7FD]'>8. Changes to This Policy</h2>
                                <div className='mb-4 md:mb-6 text-[#F2EBFA]'>
                                    <p className='text-[#F2EBFA]'>We may update this privacy policy from time to time. Changes will be posted on this page with an updated effective date.</p>
                                </div>
                                <h2 id='policy-contact' className='text-base md:text-lg font-bold mb-3 md:mb-4 text-[#FAF7FD]'>9. Contact Us</h2>
                                <div className='mb-4 md:mb-6 text-[#F2EBFA]'>
                                    <p className='text-[#F2EBFA]'>If you have any questions or concerns about this privacy policy, please contact us at <a href='mailto:work@minefloat.com' style={{ color: '#F472B6', textDecoration: 'underline' }}>work@minefloat.com</a>.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PrivacyPolicy; 