check_prerequisites ()
{
    branch="$(git rev-parse --abbrev-ref HEAD)"
    #echo "Publishing to Node Package Manager using" $branch
    if [ "$branch" = "" ]
    then
        echo "Error: Invalid branch name. Ensure you are within a git repository."
        return 1
    fi
    if [ "$branch" != "master" ]
    then
        echo "Error: Your current branch name is '"$branch"'. Publishing is only allowed from master."
        return 1
    fi
    # This is not bullet proof.   There still could be local changes.  Use git status 
    # to list modified files and then wc to get the -1 to count the lines of output.
    git_change_count=$(git status --porcelain | wc -l)
    if [ $git_change_count -gt 0 ]
    then
        echo "Error: You have local changes, which is not allowed.  Use 'git status' to view."
        return 1
    fi

    # Checks for publishing to Github release
    regex='"version": "([0-9.]+)",'
    package=$(cat ./vertica-nodejs/package.json)
    [[ $package =~ $regex ]]
    version=${BASH_REMATCH[1]}
    if [ -z "$version" ]
    then
        echo "Error: Cannot detect version to be published."
        return 1
    else
        echo "[Success] Detected version to be published: $version"
    fi

    if [ -z "$GITHUB_TOKEN" ]
    then
        echo "Error: Cannot detect Github token. Set the Github token via GITHUB_TOKEN environment variable."
        return 1
    fi

    return 0;
}


echo "This script will publish vertica-nodejs to Node Package Manager (NPM) and Github release page."
echo "This includes the Vertica specific packages v-connection-string, v-pool and v-protocol."
dry_run_arg=""

check_prerequisites
if [ "$?" = 1 ]
then
    dry_run_arg="--dry-run"
    echo "Warning: Preconditions not met.   Publishing will use --dry-run argument."
fi

read -p "Enter [yes] to publish [no] " shouldContinue
# Note: ${Variable,,} converts the expression to lower case, however this does not work on macos
# As an alternative, this uses shopt to turn on no case match.  But that only works with the "]]" syntax:
#  if [[ xyz ]] 
# and not 
#  if [ xyz ] 
# Therefore, any changes to this logic should be tested on linux and macos.
shopt -s nocasematch
if [[ ${shouldContinue} == "yes" ]]; then
    echo "Cleaning up generated files.."
    # Removing node_modules ensures that we don't use old compiled javascript files
    rm -rf ../node_modules
    echo "Building vertica-nodejs.."
    # This builds the project, which compiles the typescript into javascript files
    (cd .. && yarn)
    echo "Publishing to Node Package Manager.."
    npm publish ./v-connection-string $dry_run_arg
    npm publish ./v-pool $dry_run_arg
    npm publish ./v-protocol $dry_run_arg
    npm publish ./vertica-nodejs $dry_run_arg

    if [ -z "$dry_run_arg" ]
    then
	echo "Publishing to Github release.."
	curl -X POST \
          -H "Accept: application/vnd.github+json" \
          -H "Authorization: Bearer $GITHUB_TOKEN"\
          -H "X-GitHub-Api-Version: 2022-11-28" \
          https://api.github.com/repos/vertica/vertica-nodejs/releases \
          -d '{"tag_name":"'$version'","target_commitish":"master","name":"'$version'","draft":false,"prerelease":false,"generate_release_notes":true}'
    else
	echo "Canceled to publish to Github release in dry run"
    fi
else
    echo "Publishing canceled"
fi

