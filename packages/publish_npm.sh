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
    return 0;
}


echo "This script will publish vertica-nodejs to Node Package Manager (NPM)."
echo "This includes the Vertica specific packages v-connection-string, v-pool and v-protocol."
dry_run_arg=""

check_prerequisites
if [ "$?" = 1 ]
then
    dry_run_arg="--dry-run"
    echo "Warning: Preconditions not met.   Publishing will use --dry-run argument."
fi

read -p "Enter [yes] to publish [no] " shouldContinue
# Note: ${Variable,,} converts the expression to lower case
if [[ ${shouldContinue,,} == "yes" ]]; then
    echo "Publishing to Node Package Manager.."
    npm publish ./v-connection-string --tag MVP $dry_run_arg
    npm publish ./v-pool --tag MVP  $dry_run_arg
    npm publish ./v-protocol --tag MVP  $dry_run_arg
    npm publish ./vertica-nodejs --tag MVP  $dry_run_arg
else
    echo "Publishing canceled"
fi

