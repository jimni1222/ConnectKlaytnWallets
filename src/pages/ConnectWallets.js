import React, { Component } from 'react'
import QRCode from 'qrcode.react'
import { prepare, getResult } from 'klip-sdk'
import './ConnectWallets.css'
import Caver from 'caver-js'

const DEFAULF_NETWORK_ID = 8217
const bappName = 'Jamie World'
let caver

class ConnectWallets extends Component {
    constructor(props) {
        super(props)
        this.state = {
            address: '',
            balance: 0,
            requestKey: '',
            connectWalletBtnVisible: true,
            qrVisible: false,
            accountViewVisible: false,
            klip: false,
            kaikas: false,
            netViewVisible: false,
        }
    }

    componentDidMount() {
        this.prepareAuthRequest()
    }

    prepareAuthRequest = async () => {
        const res = await prepare.auth({ bappName })
        if (res.err) {
            console.log(res.err)
        } else if (res.request_key) {
            this.setState({ requestKey: res.request_key })
        }
    }

    connectKlip = async () => {
        this.setState({ connectWalletBtnVisible: false, qrVisible: true, klip: true, kaikas: false })

        caver = new Caver('https://internal.cypress.klaytn.net:8651')

        const intervalId = setInterval(async () => {
            const info = await getResult(this.state.requestKey)
            if (info.result && info.result.klaytn_address && info.status === 'completed') {
                clearInterval(intervalId)
                this.setState({ qrVisible: false, network: this.getNetworkName(), netViewVisible: true })
                this.getBalance(info.result.klaytn_address)
            }
        }, 1000)
    }

    connectKaikas = async () => {
        this.setState({ connectWalletBtnVisible: false, kaikas: true, klip: false })

        const { klaytn } = window

        if (klaytn) {
            try {
                await klaytn.enable()
                caver = new Caver(window.klaytn)
                this.setState({ network: this.getNetworkName(klaytn.networkVersion), netViewVisible: true })
                this.getBalance(klaytn.selectedAddress)

                klaytn.on('accountsChanged', () => this.getBalance(klaytn.selectedAddress))
                klaytn.on('networkChanged', () => {
                    this.setState({ network: this.getNetworkName(klaytn.networkVersion) })
                    this.getBalance(klaytn.selectedAddress)
                })
            } catch (error) {
                console.log('User denied account access')
            }
        } else {
            console.log('Non-Kaikas browser detected. You should consider trying Kaikas!')
        }
    }

    getBalance = async address => {
        caver.rpc.klay.getBalance(address).then(b => {
            const balanceInKLAY = caver.utils.convertFromPeb(b, 'KLAY')
            this.setState({ address, accountViewVisible: true, balance: balanceInKLAY.slice(0, balanceInKLAY.indexOf('.') + 7) })
        })
    }

    getNetworkName = networkId => {
        if (!networkId) networkId = DEFAULF_NETWORK_ID
        return networkId === 8217 ? 'Cypress' : networkId === 1001 ? 'Baobab' : 'Custom Network'
    }

    render() {
        const { address, balance, connectWalletBtnVisible, qrVisible, accountViewVisible, netViewVisible } = this.state
        return (
            <div>
                <div className="netView" style={{ display: netViewVisible ? 'block' : 'none' }}>
                    <div>Klaytn Network: {this.state.network}</div>
                </div>
                <br />
                <div className="accountView" style={{ display: accountViewVisible ? 'block' : 'none' }}>
                    <div>{address}</div>
                    <br />
                    <div>{balance} KLAY</div>
                </div>
                <div>
                    <QRCode
                        value={`https://klipwallet.com/?target=/a2a?request_key=${this.state.requestKey}`}
                        style={{ display: qrVisible ? 'block' : 'none', margin: 'auto', marginTop: '3%' }}
                    />
                </div>
                <div>
                    <button
                        type="button"
                        onClick={this.connectKlip}
                        className="WalletConnectBtn KlipBtn"
                        style={{ display: connectWalletBtnVisible ? 'inline' : 'none' }}
                    >
                        <div style={{ marginLeft: '10%', marginRight: '10%' }}>
                            <span style={{ verticalAlign: 'middle' }}>
                                <img src="Klip_Symbol_White.png" alt="" style={{ width: '26%' }} />
                            </span>
                            <span style={{ verticalAlign: 'middle', marginLeft: '-3%' }}>Klip으로 로그인</span>
                        </div>
                    </button>
                </div>
                <div>
                    <button
                        type="button"
                        onClick={this.connectKaikas}
                        className="WalletConnectBtn KaikasBtn"
                        style={{ display: connectWalletBtnVisible ? 'inline' : 'none' }}
                    >
                        <div style={{ marginLeft: '10%', marginRight: '10%' }}>
                            <span style={{ verticalAlign: 'middle' }}>
                                <img src="Klaytn_Symbol_White.png" alt="" style={{ width: '17%' }} />
                            </span>
                            <span style={{ verticalAlign: 'middle' }}>Kaikas 지갑 연결</span>
                        </div>
                    </button>
                </div>
            </div>
        )
    }
}

export default ConnectWallets
