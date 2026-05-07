pnpm build
npx cap sync
cd android
// bump versions
./gradlew bundleRelease


now ==> ./scripts/build.sh