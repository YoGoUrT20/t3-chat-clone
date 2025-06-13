import React from 'react';
import LiquidGlassButton from './LiquidGlassButton';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import SettingsTabs from './ui/TosTabs';

const tabs = ['Terms of Service', 'Privacy Policy', 'Security Policy', 'FAQ & Support'];
const tabRoutes = ['/terms-of-service', '/privacy-policy', '/security-policy', '/faq-support'];

function TermsOfService() {
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
                                <h1 className='text-4xl font-black mb-8 text-[#FAF7FD]'>QUIVER CHAT TERMS OF SERVICE</h1>
                                <div className='text-[#FAF7FD] mb-10 text-base'>Last Updated: 2025-05-31</div>
                                <h2 className='text-lg font-bold mb-4 text-[#FAF7FD]'>1. Welcome</h2>
                                <ul className='space-y-3 pl-2 w-full'>
                                    <li className='flex items-start'>
                                        <span className='text-[#DC749E] text-2xl leading-8 mr-3 select-none flex-shrink-0'>&bull;</span>
                                        <span className='text-[#F2EBFA] flex-1 max-w-5xl leading-8' style={{ wordBreak: 'break-word' }}>
                                            Welcome to Quiver Chat! This is a simple chat website for friendly conversation. By using this site, you agree to these terms. If you have any questions, just email us at <a href="mailto:work@minefloat.com.com" style={{ color: '#F472B6', textDecoration: 'underline' }}>work@minefloat.com.com</a>.
                                        </span>
                                    </li>
                                    <li className='flex items-start'>
                                        <span className='text-[#DC749E] text-2xl leading-8 mr-3 select-none flex-shrink-0'>&bull;</span>
                                        <span className='text-[#F2EBFA] flex-1 max-w-5xl leading-8' style={{ wordBreak: 'break-word' }}>
                                            You must be at least 13 years old to use Quiver Chat.
                                        </span>
                                    </li>
                                </ul>
                                <h2 className='text-lg font-bold mb-4 text-[#FAF7FD]'>2. Accounts</h2>
                                <ul className='space-y-3 pl-2 w-full'>
                                    <li className='flex items-start'>
                                        <span className='text-[#DC749E] text-2xl leading-8 mr-3 select-none flex-shrink-0'>&bull;</span>
                                        <span className='text-[#F2EBFA] flex-1 max-w-5xl leading-8' style={{ wordBreak: 'break-word' }}>
                                            Please use your account responsibly. Don&apos;t share your password with others. If you notice anything weird with your account, let us know at <a href="mailto:work@minefloat.com.com" style={{ color: '#F472B6', textDecoration: 'underline' }}>work@minefloat.com.com</a>.
                                        </span>
                                    </li>
                                </ul>
                                <h2 className='text-lg font-bold mb-4 text-[#FAF7FD]'>3. Content</h2>
                                <ul className='space-y-3 pl-2 w-full'>
                                    <li className='flex items-start'>
                                        <span className='text-[#DC749E] text-2xl leading-8 mr-3 select-none flex-shrink-0'>&bull;</span>
                                        <span className='text-[#F2EBFA] flex-1 max-w-5xl leading-8' style={{ wordBreak: 'break-word' }}>
                                            You can chat and share messages here. Please be respectful and don&apos;t post anything illegal, harmful, or offensive. If you see something that shouldn&apos;t be here, contact us.
                                        </span>
                                    </li>
                                    <li className='flex items-start'>
                                        <span className='text-[#DC749E] text-2xl leading-8 mr-3 select-none flex-shrink-0'>&bull;</span>
                                        <span className='text-[#F2EBFA] flex-1 max-w-5xl leading-8' style={{ wordBreak: 'break-word' }}>
                                            You own your messages, but by posting them here, you let us show them to others on the site. We don&apos;t claim ownership of your content.
                                        </span>
                                    </li>
                                </ul>
                                <h2 className='text-lg font-bold mb-4 text-[#FAF7FD]'>4. Privacy</h2>
                                <ul className='space-y-3 pl-2 w-full'>
                                    <li className='flex items-start'>
                                        <span className='text-[#DC749E] text-2xl leading-8 mr-3 select-none flex-shrink-0'>&bull;</span>
                                        <span className='text-[#F2EBFA] flex-1 max-w-5xl leading-8' style={{ wordBreak: 'break-word' }}>
                                            We care about your privacy. We only use your info to run the chat site. For any privacy questions, email <a href="mailto:work@minefloat.com.com" style={{ color: '#F472B6', textDecoration: 'underline' }}>work@minefloat.com.com</a>.
                                        </span>
                                    </li>
                                </ul>
                                <h2 className='text-lg font-bold mb-4 text-[#FAF7FD]'>5. Rules</h2>
                                <ul className='space-y-3 pl-2 w-full'>
                                    <li className='flex items-start'>
                                        <span className='text-[#DC749E] text-2xl leading-8 mr-3 select-none flex-shrink-0'>&bull;</span>
                                        <span className='text-[#F2EBFA] flex-1 max-w-5xl leading-8' style={{ wordBreak: 'break-word' }}>
                                            Please don&apos;t spam, harass, or abuse others. Don&apos;t use bots or try to break the site. If you break the rules, we may suspend your account.
                                        </span>
                                    </li>
                                </ul>
                                <h2 className='text-lg font-bold mb-4 text-[#FAF7FD]'>6. Changes and Contact</h2>
                                <ul className='space-y-3 pl-2 w-full'>
                                    <li className='flex items-start'>
                                        <span className='text-[#DC749E] text-2xl leading-8 mr-3 select-none flex-shrink-0'>&bull;</span>
                                        <span className='text-[#F2EBFA] flex-1 max-w-5xl leading-8' style={{ wordBreak: 'break-word' }}>
                                            We might update these terms sometimes. If you keep using the site after changes, that means you agree to the new terms. If you have any questions or issues, just email <a href="mailto:work@minefloat.com.com" style={{ color: '#F472B6', textDecoration: 'underline' }}>work@minefloat.com.com</a>.
                                        </span>
                                    </li>
                                </ul>
                                <h2 className='text-lg font-bold mb-4 text-[#FAF7FD]'>7. Liability</h2>
                                <ul className='space-y-3 pl-2 w-full'>
                                    <li className='flex items-start'>
                                        <span className='text-[#DC749E] text-2xl leading-8 mr-3 select-none flex-shrink-0'>&bull;</span>
                                        <span className='text-[#F2EBFA] flex-1 max-w-5xl leading-8' style={{ wordBreak: 'break-word' }}>
                                            We do our best to keep Quiver Chat running smoothly, but sometimes things might go wrong. We&apos;re not responsible for any damages or losses from using the site.
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

export default TermsOfService; 