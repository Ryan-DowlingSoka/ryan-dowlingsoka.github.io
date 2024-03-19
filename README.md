# Installing Ruby and Jekyll
## Installation via RubyInstaller
The easiest way to install Ruby and Jekyll is by using the RubyInstaller for Windows.

RubyInstaller is a self-contained Windows-based installer that includes the Ruby language, an execution environment, important documentation, and more.

We only cover RubyInstaller-2.4 and newer here. Older versions need to install the Devkit manually.

```Ruby 3.3.0```

1. Download and install a **Ruby+Devkit** version from RubyInstaller Downloads. Use default options for installation.
2. Run the `ridk install` step on the last stage of the installation wizard. This is needed for installing gems with native extensions. You can find additional information regarding this in the RubyInstaller Documentation. From the options choose `MSYS2 and MINGW development tool chain`.
3. Open a new command prompt window from the start menu, so that changes to the `PATH` environment variable becomes effective. Install Jekyll and Bundler using `gem install jekyll bundler`
4. Check if Jekyll has been installed properly: `jekyll -v`

# Install libvps files.

`gem install ruby-vips`
NOTE: couldn't get web3ps to work, don't understand, and I don't like it.

# Setting up the blog.

1. `bundle install`
2. `bundle exec jekyll serve`

