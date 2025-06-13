import React from 'react';
import LiquidGlassButton from './LiquidGlassButton';
import { ArrowLeft, HelpCircle, Mail } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import SettingsTabs from './ui/TosTabs';

const tabs = ['Terms of Service', 'Privacy Policy', 'Security Policy', 'FAQ & Support'];
const tabRoutes = ['/terms-of-service', '/privacy-policy', '/security-policy', '/faq-support'];

function FAQSupport() {
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
                                <h1 className='text-4xl font-black mb-8 text-[#FAF7FD] flex items-center gap-3'><HelpCircle size={32} className='inline-block text-[#DC749E]' />FAQ & Support</h1>
                                <div className='text-[#FAF7FD] mb-10 text-base'>Last Updated: 2025-02-14</div>
                                <h2 className='text-lg font-bold mb-4 text-[#FAF7FD]'>Frequently Asked Questions</h2>
                                <ul className='space-y-6 pl-2 w-full'>
                                    <li className='flex items-start'>
                                        <span className='text-[#DC749E] text-2xl leading-8 mr-3 select-none flex-shrink-0'>&bull;</span>
                                        <span className='text-[#F2EBFA] flex-1 max-w-5xl leading-8' style={{ wordBreak: 'break-word' }}>
                                            <span className='font-bold'>What is Quiver?</span><br />
                                            Quiver is a modern, full-stack Opensource chat application built with react and Firebase, featuring real-time messaging with multiple AI models, stunning customizability, and a beautiful UI.
                                        </span>
                                    </li>
                                    <li className='flex items-start'>
                                        <span className='text-[#DC749E] text-2xl leading-8 mr-3 select-none flex-shrink-0'>&bull;</span>
                                        <span className='text-[#F2EBFA] flex-1 max-w-5xl leading-8' style={{ wordBreak: 'break-word' }}>
                                            <span className='font-bold'>How do I start a new chat?</span><br />
                                            Click the &apos;New Chat&apos; button on the main page or sidebar. You can start chatting instantly after logging in.
                                        </span>
                                    </li>
                                    <li className='flex items-start'>
                                        <span className='text-[#DC749E] text-2xl leading-8 mr-3 select-none flex-shrink-0'>&bull;</span>
                                        <span className='text-[#F2EBFA] flex-1 max-w-5xl leading-8' style={{ wordBreak: 'break-word' }}>
                                            <span className='font-bold'>Can I share a chat with others?</span><br />
                                            Yes, you can share a chat by clicking the share icon in the chat window. A unique link will be generated for you to send to others.
                                        </span>
                                    </li>
                                    <li className='flex items-start'>
                                        <span className='text-[#DC749E] text-2xl leading-8 mr-3 select-none flex-shrink-0'>&bull;</span>
                                        <span className='text-[#F2EBFA] flex-1 max-w-5xl leading-8' style={{ wordBreak: 'break-word' }}>
                                            <span className='font-bold'>Why am I not receiving real-time messages?</span><br />
                                            Make sure you have a stable internet connection. If the issue persists, try refreshing the page or logging out and back in.
                                        </span>
                                    </li>
                                    <li className='flex items-start'>
                                        <span className='text-[#DC749E] text-2xl leading-8 mr-3 select-none flex-shrink-0'>&bull;</span>
                                        <span className='text-[#F2EBFA] flex-1 max-w-5xl leading-8' style={{ wordBreak: 'break-word' }}>
                                            <span className='font-bold'>How do I report a bug or request a feature?</span><br />
                                            Please open an issue on our GitHub repository or contact support. We appreciate your feedback!
                                        </span>
                                    </li>
                                </ul>
                                <h2 className='text-lg font-bold mb-4 mt-10 text-[#FAF7FD] flex items-center gap-2'><Mail size={20} className='inline-block text-[#DC749E]' />Contact Support</h2>
                                <div className='text-[#F2EBFA] mb-6'>
                                    For any other questions or issues, email <a href='mailto:work@minefloat.com' style={{ color: '#F472B6', textDecoration: 'underline' }}>work@minefloat.com</a> and our team will respond as soon as possible.
                                </div>
                                <div className='text-[#F2EBFA] mb-2'>
                                    Please include as much detail as possible so we can assist you quickly.
                                </div>
                                <div className='text-[#F2EBFA] mt-8 flex items-center gap-2'>
                                    <svg xmlns='http://www.w3.org/2000/svg' width='20' height='20' fill='none' viewBox='0 0 24 24' stroke='currentColor' className='inline-block text-[#DC749E]'><path strokeLinecap='round' strokeLinejoin='round' strokeWidth='2' d='M12 2C6.477 2 2 6.477 2 12c0 4.418 2.867 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.221-.253-4.555-1.112-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.848-2.337 4.695-4.566 4.944.359.309.678.919.678 1.852 0 1.336-.012 2.417-.012 2.747 0 .267.18.577.688.48C19.135 20.163 22 16.417 22 12c0-5.523-4.477-10-10-10z'/></svg>
                                    <a href='https://github.com/YoGoUrT20/t3-chat-clone' target='_blank' rel='noopener noreferrer' style={{ color: '#F472B6', textDecoration: 'underline' }}>GitHub Repository</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FAQSupport; 