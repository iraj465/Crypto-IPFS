# Encrypted asset exchange using IPFS
This NodeJs app leverages IPFS protocol for exchanging encrypted data between Patients and Doctors. (Created as part of paper https://arxiv.org/abs/2012.05141)

# Install IPFS
[Install IPFS for your system](https://docs.ipfs.io/how-to/command-line-quick-start/#install-ipfs)

# Getting started
1. Clone the repo and git checkout to branch **ipfs**

2. Install `npm` packages by running `npm i` in your terminal.(Must have `npm` installed beforehand)

3. After you have completed Step 1, run `ipfs daemon` in a terminal to spin up the ipfs server. (A peer CID will be assigned to you automatically.) You can check your node server by navigating to `localhost:5001/webui/`

4. Run `npm run dev` in a separate terminal to start the Developement NodeJS server at `localhost:3000`

5. You can use sample file in `files/`

6. You're all set!
