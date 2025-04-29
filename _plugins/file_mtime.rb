module FileMtimeFilter
    def file_mtime(input)
      File.mtime(File.join(Dir.pwd, input)).to_i
    end
  end

Liquid::Template.register_filter(FileMtimeFilter)