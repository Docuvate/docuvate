// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'create_folder_request_dto.dart';

// **************************************************************************
// BuiltValueGenerator
// **************************************************************************

class _$CreateFolderRequestDto extends CreateFolderRequestDto {
  @override
  final String name;
  @override
  final String? parentId;
  @override
  final String? mappeId;

  factory _$CreateFolderRequestDto(
          [void Function(CreateFolderRequestDtoBuilder)? updates]) =>
      (CreateFolderRequestDtoBuilder()..update(updates))._build();

  _$CreateFolderRequestDto._({required this.name, this.parentId, this.mappeId})
      : super._();
  @override
  CreateFolderRequestDto rebuild(
          void Function(CreateFolderRequestDtoBuilder) updates) =>
      (toBuilder()..update(updates)).build();

  @override
  CreateFolderRequestDtoBuilder toBuilder() =>
      CreateFolderRequestDtoBuilder()..replace(this);

  @override
  bool operator ==(Object other) {
    if (identical(other, this)) return true;
    return other is CreateFolderRequestDto &&
        name == other.name &&
        parentId == other.parentId &&
        mappeId == other.mappeId;
  }

  @override
  int get hashCode {
    var _$hash = 0;
    _$hash = $jc(_$hash, name.hashCode);
    _$hash = $jc(_$hash, parentId.hashCode);
    _$hash = $jc(_$hash, mappeId.hashCode);
    _$hash = $jf(_$hash);
    return _$hash;
  }

  @override
  String toString() {
    return (newBuiltValueToStringHelper(r'CreateFolderRequestDto')
          ..add('name', name)
          ..add('parentId', parentId)
          ..add('mappeId', mappeId))
        .toString();
  }
}

class CreateFolderRequestDtoBuilder
    implements Builder<CreateFolderRequestDto, CreateFolderRequestDtoBuilder> {
  _$CreateFolderRequestDto? _$v;

  String? _name;
  String? get name => _$this._name;
  set name(String? name) => _$this._name = name;

  String? _parentId;
  String? get parentId => _$this._parentId;
  set parentId(String? parentId) => _$this._parentId = parentId;

  String? _mappeId;
  String? get mappeId => _$this._mappeId;
  set mappeId(String? mappeId) => _$this._mappeId = mappeId;

  CreateFolderRequestDtoBuilder() {
    CreateFolderRequestDto._defaults(this);
  }

  CreateFolderRequestDtoBuilder get _$this {
    final $v = _$v;
    if ($v != null) {
      _name = $v.name;
      _parentId = $v.parentId;
      _mappeId = $v.mappeId;
      _$v = null;
    }
    return this;
  }

  @override
  void replace(CreateFolderRequestDto other) {
    _$v = other as _$CreateFolderRequestDto;
  }

  @override
  void update(void Function(CreateFolderRequestDtoBuilder)? updates) {
    if (updates != null) updates(this);
  }

  @override
  CreateFolderRequestDto build() => _build();

  _$CreateFolderRequestDto _build() {
    final _$result = _$v ??
        _$CreateFolderRequestDto._(
          name: BuiltValueNullFieldError.checkNotNull(
              name, r'CreateFolderRequestDto', 'name'),
          parentId: parentId,
          mappeId: mappeId,
        );
    replace(_$result);
    return _$result;
  }
}

// ignore_for_file: deprecated_member_use_from_same_package,type=lint
