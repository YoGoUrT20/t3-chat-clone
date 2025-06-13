import React from 'react';
import LiquidGlassButton from './LiquidGlassButton';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import SettingsTabs from './ui/TosTabs';

const tabs = ['Terms of Service', 'Privacy Policy', 'Security Policy', 'FAQ & Support'];
const tabRoutes = ['/terms-of-service', '/privacy-policy', '/security-policy', '/faq-support'];

function SecurityPolicy() {
    const navigate = useNavigate();
    const location = useLocation();
    const activeIndex = tabRoutes.findIndex(route => location.pathname.startsWith(route));
    return (
        <div className='overflow-y-auto h-screen w-full'>
            <div className='flex justify-center items-center w-full min-h-screen'>
                <div className='absolute top-6 left-6 z-20'>
                    <LiquidGlassButton
                        onClick={() => navigate('/')}
                        icon={<ArrowLeft size={18} />}
                        text={'Back'}
                        variant={'rect'}
                    />
                </div>
                <div className='w-full max-w-[1200px] flex flex-row bg-transparent rounded-xl shadow-none border-none min-h-[500px]'>
                    <div className='flex flex-col items-center justify-start pt-16 px-10 bg-transparent relative min-w-[220px]' style={{minHeight:220}} />
                    <div className='flex-1 flex flex-col items-start justify-start pt-10 pl-8 pr-8 relative'>
                        <SettingsTabs
                            tabs={tabs}
                            activeIndex={activeIndex}
                            setActiveIndex={i => navigate(tabRoutes[i])}
                        />
                        <div className='w-full mt-8 min-h-[300px] min-w-[350px] rounded-xl shadow border border-[#ececec] dark:border-[#232228] flex flex-col transition-none bg-transparent'>
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
                            <div className='prose prose-pink prose-tos max-w-5xl w-full mx-auto p-4 dark:prose-invert prose-pre:m-0 prose-pre:bg-transparent prose-pre:p-0'>
                                <h1 className='text-4xl font-black mb-8 text-[#FAF7FD]'>QUIVER SECURITY POLICY</h1>
                                <div className='text-[#FAF7FD] mb-10 text-base'>Last Updated: 2025-02-14</div>
                                <h2 className='text-lg font-bold mb-4 text-[#FAF7FD]'>1. Introduction</h2>
                                <ul className='space-y-3 pl-2 w-full'>
                                    <li className='flex items-start'>
                                        <span className='text-[#DC749E] text-2xl leading-8 mr-3 select-none flex-shrink-0'>&bull;</span>
                                        <span className='text-[#F2EBFA] flex-1 max-w-5xl leading-8' style={{ wordBreak: 'break-word' }}>
                                            We care about your privacy and do our best to keep your data safe. This page explains how we handle security on our website.
                                        </span>
                                    </li>
                                </ul>
                                <h2 className='text-lg font-bold mb-4 text-[#FAF7FD]'>2. Reporting Security Issues</h2>
                                <ul className='space-y-3 pl-2 w-full'>
                                    <li className='flex items-start'>
                                        <span className='text-[#F2EBFA] flex-1 max-w-5xl leading-8' style={{ wordBreak: 'break-word' }}>
                                            If you notice a security problem or something that looks suspicious, please let us know by emailing <a href="mailto:work@quiver.com" style={{ color: '#F472B6', textDecoration: 'underline' }}>work@quiver.com</a>.
                                            <ul className='pl-6 mt-2 space-y-2'>
                                                <li className='flex items-start'>
                                                    <span className='text-[#DC749E] text-xl leading-7 mr-2 select-none flex-shrink-0'>&bull;</span>
                                                    <span className='text-[#F2EBFA] flex-1 leading-7' style={{ wordBreak: 'break-word' }}>
                                                        Please describe what you found and how we can see it too.
                                                    </span>
                                                </li>
                                                <li className='flex items-start'>
                                                    <span className='text-[#DC749E] text-xl leading-7 mr-2 select-none flex-shrink-0'>&bull;</span>
                                                    <span className='text-[#F2EBFA] flex-1 leading-7' style={{ wordBreak: 'break-word' }}>
                                                        If possible, include screenshots or steps to help us understand.
                                                    </span>
                                                </li>
                                            </ul>
                                            We will do our best to reply quickly and fix any real issues.
                                        </span>
                                    </li>
                                </ul>
                                <h2 className='text-lg font-bold mb-4 text-[#FAF7FD]'>3. How We Protect Your Data</h2>
                                <ul className='space-y-3 pl-2 w-full'>
                                    <li className='flex items-start'>
                                        <span className='text-[#DC749E] text-2xl leading-8 mr-3 select-none flex-shrink-0'>&bull;</span>
                                        <span className='text-[#F2EBFA] flex-1 max-w-5xl leading-8' style={{ wordBreak: 'break-word' }}>
                                            We use basic security measures to protect your information, like using secure connections (HTTPS) and keeping our software up to date.
                                        </span>
                                    </li>
                                    <li className='flex items-start'>
                                        <span className='text-[#DC749E] text-2xl leading-8 mr-3 select-none flex-shrink-0'>&bull;</span>
                                        <span className='text-[#F2EBFA] flex-1 max-w-5xl leading-8' style={{ wordBreak: 'break-word' }}>
                                            We only collect the information we need to run the website and do not share your data with others unless required by law.
                                        </span>
                                    </li>
                                    <li className='flex items-start'>
                                        <span className='text-[#DC749E] text-2xl leading-8 mr-3 select-none flex-shrink-0'>&bull;</span>
                                        <span className='text-[#F2EBFA] flex-1 max-w-5xl leading-8' style={{ wordBreak: 'break-word' }}>
                                            Your data is stored securely and only accessible to people who need it to keep the website running.
                                        </span>
                                    </li>
                                </ul>
                                <h2 className='text-lg font-bold mb-4 text-[#FAF7FD]'>4. Your Responsibilities</h2>
                                <ul className='space-y-3 pl-2 w-full'>
                                    <li className='flex items-start'>
                                        <span className='text-[#F2EBFA] flex-1 max-w-5xl leading-8' style={{ wordBreak: 'break-word' }}>
                                            To help keep your account safe:
                                            <ol className='pl-6 mt-2 space-y-2 list-decimal'>
                                                <li className='flex items-start'>
                                                    <span className='text-[#DC749E] text-xl leading-7 mr-2 select-none flex-shrink-0'>1.</span>
                                                    <span className='text-[#F2EBFA] flex-1 leading-7' style={{ wordBreak: 'break-word' }}>
                                                        Use a strong password and don&apos;t share it with anyone.
                                                    </span>
                                                </li>
                                                <li className='flex items-start'>
                                                    <span className='text-[#DC749E] text-xl leading-7 mr-2 select-none flex-shrink-0'>2.</span>
                                                    <span className='text-[#F2EBFA] flex-1 leading-7' style={{ wordBreak: 'break-word' }}>
                                                        Log out when you&apos;re done, especially on shared devices.
                                                    </span>
                                                </li>
                                                <li className='flex items-start'>
                                                    <span className='text-[#DC749E] text-xl leading-7 mr-2 select-none flex-shrink-0'>3.</span>
                                                    <span className='text-[#F2EBFA] flex-1 leading-7' style={{ wordBreak: 'break-word' }}>
                                                        Let us know if you see anything unusual with your account.
                                                    </span>
                                                </li>
                                            </ol>
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SecurityPolicy; 