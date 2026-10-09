// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'document_chat_provider_info_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$DocumentChatProviderInfoDto extends DocumentChatProviderInfoDto {
  @override
  final String id;
  @override
  final String label;
  @override
  final String description;
  @override
  final bool available;

  factory _$DocumentChatProviderInfoDto(
          [void Function(DocumentChatProviderInfoDtoBuilder)? updates]) =>
      (new DocumentChatProviderInfoDtoBuilder()..update(updates))._build();

  _$DocumentChatProviderInfoDto._(
      {required this.id,
      required this.label,
      required this.description,
      required this.available})
      : super._() {
    BuiltValueNullFieldError.checkNotNull(
        id, r'DocumentChatProviderInfoDto', 'id');
    BuiltValueNullFieldError.checkNotNull(
        label, r'DocumentChatProviderInfoDto', 'label');
    BuiltValueNullFieldError.checkNotNull(
        description, r'DocumentChatProviderInfoDto', 'description');
    BuiltValueNullFieldError.checkNotNull(
        available, r'DocumentChatProviderInfoDto', 'available');
  }

  @override
  DocumentChatProviderInfoDto rebuild(
          void Function(DocumentChatProviderInfoDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  DocumentChatProviderInfoDtoBuilder toBuilder() =>
      new DocumentChatProviderInfoDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is DocumentChatProviderInfoDto &&
        id == other.id &&
        label == other.label &&
        description == other.description &&
        available == other.available;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, id.hashCode);
    _$hash = $jc(_$hash, label.hashCode);
    _$hash = $jc(_$hash, description.hashCode);
    _$hash = $jc(_$hash, available.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'DocumentChatProviderInfoDto')
          ..add('id', id)
          ..add('label', label)
          ..add('description', description)
          ..add('available', available))
        .toString();
  }
}

class DocumentChatProviderInfoDtoBuilder
    implements
        Builder<DocumentChatProviderInfoDto,
            DocumentChatProviderInfoDtoBuilder> {
  _$DocumentChatProviderInfoDto? _$v;

  String? _id;
  String? get id => _$this._id;
  set id(String? id) => _$this._id = id;

  String? _label;
  String? get label => _$this._label;
  set label(String? label) => _$this._label = label;

  String? _description;
  String? get description => _$this._description;
  set description(String? description) => _$this._description = description;

  bool? _available;
  bool? get available => _$this._available;
  set available(bool? available) => _$this._available = available;

  DocumentChatProviderInfoDtoBuilder() {
    DocumentChatProviderInfoDto._defaults(this);
  }

  DocumentChatProviderInfoDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _id = $v.id;
      _label = $v.label;
      _description = $v.description;
      _available = $v.available;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(DocumentChatProviderInfoDto other) {
    ArgumentError.checkNotNull(other, 'other');
    _$v = other as _$DocumentChatProviderInfoDto;
  }

  @override
  void update(void Function(DocumentChatProviderInfoDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  DocumentChatProviderInfoDto build() => _build();

  _$DocumentChatProviderInfoDto _build() {
    final _$result = _$v ??
        new _$DocumentChatProviderInfoDto._(
            id: BuiltValueNullFieldError.checkNotNull(
                id, r'DocumentChatProviderInfoDto', 'id'),
            label: BuiltValueNullFieldError.checkNotNull(
                label, r'DocumentChatProviderInfoDto', 'label'),
            description: BuiltValueNullFieldError.checkNotNull(
                description, r'DocumentChatProviderInfoDto', 'description'),
            available: BuiltValueNullFieldError.checkNotNull(
                available, r'DocumentChatProviderInfoDto', 'available'));
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
