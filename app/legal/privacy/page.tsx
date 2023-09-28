import styles from '@/styles/Privacy.module.css';
import Link from 'next/link';

export default function PrivacyPolicy() {

    return (
        <div className={styles.page}>
            <div className={styles.main}>
                <div className={styles.head}>
                    <h1 className={styles.title}>
                        privacy policy
                    </h1>
                    <p className={styles.subtitle}>
                        Last updated September 14, 2023
                    </p>
                </div>
                <div className={styles.bodyText}>
                    <p className={styles.text}>
                        This privacy notice for clxrity (&#34;<span className={styles.boldSpan}>we</span>,&#34; &#34;<span className={styles.boldSpan}>us</span>,&#34; or &#34;<span className={styles.boldSpan}>our</span>&#34;), describes how and why we might collect, store, use, and/or share (&#34;<span className={styles.boldSpan}>process</span>&#34;) your information when you use our services (&#34;<span className={styles.boldSpan}>Services</span>&#34;), such as when you:
                    </p>
                        <ul className={`${styles.list} ${styles.text}`}>
                            <li>
                                Visit our website at <Link href='/' className={styles.link}>
                                    https://clxrity.xyz
                                </Link>, or any website of ours that links to this privacy notice
                            </li>
                            <li>
                                Engage with us in other related ways, including any sales, marketing, or events
                            </li>
                        </ul>
                    <p className={styles.text}>
                        <span className={styles.prompt}>
                            Questions or concerns? {' '}
                        </span>
                        Reading this privacy notice will help you understand your privacy rights and choices. If you do not agree with our policies and practices, please do not use our Services. If you still have any questions or concerns, please contact us at contact@mjanglin.com.
                    </p>
                </div>
                <div className={styles.bodyText}>
                    <h2 className={styles.heading}>
                        summary of key points
                    </h2>
                    <p className={`${styles.text} italic font-semibold`}>
                        This summary provides key points from our privacy notice, but you can find out more details about any of these topics by clicking the link following each key point or by using our <Link href='#toc' className={styles.link}>
                            table of contents
                        </Link> below to find the section you are looking for.
                    </p>
                    <p className={styles.text}>
                        <span className={styles.prompt}>
                            What personal information do we process? {' '}
                        </span>
                        When you visit, use or navigate our Services, we may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use. Learn more about <Link className={styles.link} href='#personalinfo'>
                            personal information you disclose to us
                        </Link>.
                    </p>
                    <p className={styles.text}>
                        <span className={styles.prompt}>
                            Do we process any sensitive personal information? {' '}
                        </span>
                        We do not process sensitive personal information.
                    </p>
                    <p className={styles.text}>
                        <span className={styles.prompt}>
                            Do we receive any information from third parties? {' '}
                        </span>
                        We do not receive information from third parties.
                    </p>
                    <p className={styles.text}>
                        <span className={styles.prompt}>
                            How do we process your information? {' '}
                        </span>
                        We process your information to provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law. We may also process your information for other purposes with your consent. We process your information only when we have a valid legal reason to do so. Learn more about <Link className={styles.link} href='#infouse'>
                            how we process your information
                        </Link>.
                    </p>
                </div>
            </div>
        </div>
    )
}