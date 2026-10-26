// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_document_chat_thread_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreateDocumentChatThreadRequestDto
    extends CreateDocumentChatThreadRequestDto {
  @override
  final String? title;

  factory _$CreateDocumentChatThreadRequestDto(
          [void Function(CreateDocumentChatThreadRequestDtoBuilder)?
              updates]) =>
      (new CreateDocumentChatThreadRequestDtoBuilder()..update(updates))
          ._build();

  _$CreateDocumentChatThreadRequestDto._({this.title}) : super._();

  @override
  CreateDocumentChatThreadRequestDto rebuild(
          void Function(CreateDocumentChatThreadRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateDocumentChatThreadRequestDtoBuilder toBuilder() =>
      new CreateDocumentChatThreadRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateDocumentChatThreadRequestDto && title == other.title;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, title.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateDocumentChatThreadRequestDto')
          ..add('title', title))
        .toString();
  }
}

class CreateDocumentChatThreadRequestDtoBuilder
    implements
        Builder<CreateDocumentChatThreadRequestDto,
            CreateDocumentChatThreadRequestDtoBuilder> {
  _$CreateDocumentChatThreadRequestDto? _$v;

  String? _title;
  String? get title => _$this._title;
  set title(String? title) => _$this._title = title;

  CreateDocumentChatThreadRequestDtoBuilder() {
    CreateDocumentChatThreadRequestDto._defaults(this);
  }

  CreateDocumentChatThreadRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _title = $v.title;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateDocumentChatThreadRequestDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$CreateDocumentChatThreadRequestDto;
  }

  @override
  void update(
      void Function(CreateDocumentChatThreadRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateDocumentChatThreadRequestDto build() => _build();

  _$CreateDocumentChatThreadRequestDto _build() {
    final _$result =
        _$v ?? new _$CreateDocumentChatThreadRequestDto._(title: title);
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
