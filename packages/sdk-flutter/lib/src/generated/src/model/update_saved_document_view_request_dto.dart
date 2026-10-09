//
// AUTO-GENERATED FILE, DO NOT MODIFY!
//

// ignore_for_file: unused_element
import 'package:built_collection/built_collection.dart';
import 'package:docuvate/src/generated/src/model/library_table_column_id.dart';
import 'package:built_value/built_value.dart';
import 'package:built_value/serializer.dart';

part 'update_saved_document_view_request_dto.g.dart';

/// UpdateSavedDocumentViewRequestDto
///
/// Properties:
/// * [visibleColumns] 
/// * [name] 
/// * [visibility] 
/// * [searchQuery] 
/// * [sort] 
/// * [order] 
/// * [viewMode] 
/// * [filterMode] 
/// * [listScope] 
/// * [folderId] 
/// * [mappeId] 
/// * [correspondentId] 
/// * [status] 
/// * [inbox] 
/// * [withoutNonInboxLabel] 
/// * [documentDateFrom] 
/// * [documentDateTo] 
/// * [tagIds] 
/// * [pinnedSidebar] 
@BuiltValue()
abstract class UpdateSavedDocumentViewRequestDto implements Built<UpdateSavedDocumentViewRequestDto, UpdateSavedDocumentViewRequestDtoBuilder> {
  @BuiltValueField(wireName: r'visibleColumns')
  BuiltList<LibraryTableColumnId>? get visibleColumns;

  @BuiltValueField(wireName: r'name')
  String? get name;

  @BuiltValueField(wireName: r'visibility')
  UpdateSavedDocumentViewRequestDtoVisibilityEnum? get visibility;
  // enum visibilityEnum {  private,  shared,  };

  @BuiltValueField(wireName: r'searchQuery')
  String? get searchQuery;

  @BuiltValueField(wireName: r'sort')
  UpdateSavedDocumentViewRequestDtoSortEnum? get sort;
  // enum sortEnum {  updatedAt,  createdAt,  title,  documentDate,  };

  @BuiltValueField(wireName: r'order')
  UpdateSavedDocumentViewRequestDtoOrderEnum? get order;
  // enum orderEnum {  asc,  desc,  };

  @BuiltValueField(wireName: r'viewMode')
  UpdateSavedDocumentViewRequestDtoViewModeEnum? get viewMode;
  // enum viewModeEnum {  klassisch,  karten,  fokus,  };

  @BuiltValueField(wireName: r'filterMode')
  UpdateSavedDocumentViewRequestDtoFilterModeEnum? get filterMode;
  // enum filterModeEnum {  ui,  query,  };

  @BuiltValueField(wireName: r'listScope')
  UpdateSavedDocumentViewRequestDtoListScopeEnum? get listScope;
  // enum listScopeEnum {  all,  folder,  mappe,  };

  @BuiltValueField(wireName: r'folderId')
  String? get folderId;

  @BuiltValueField(wireName: r'mappeId')
  String? get mappeId;

  @BuiltValueField(wireName: r'correspondentId')
  String? get correspondentId;

  @BuiltValueField(wireName: r'status')
  UpdateSavedDocumentViewRequestDtoStatusEnum? get status;
  // enum statusEnum {  uploaded,  queued,  extracting,  ready,  failed,  };

  @BuiltValueField(wireName: r'inbox')
  bool? get inbox;

  @BuiltValueField(wireName: r'withoutNonInboxLabel')
  bool? get withoutNonInboxLabel;

  @BuiltValueField(wireName: r'documentDateFrom')
  String? get documentDateFrom;

  @BuiltValueField(wireName: r'documentDateTo')
  String? get documentDateTo;

  @BuiltValueField(wireName: r'tagIds')
  BuiltList<String>? get tagIds;

  @BuiltValueField(wireName: r'pinnedSidebar')
  bool? get pinnedSidebar;

  UpdateSavedDocumentViewRequestDto._();

  factory UpdateSavedDocumentViewRequestDto([void updates(UpdateSavedDocumentViewRequestDtoBuilder b)]) = _$UpdateSavedDocumentViewRequestDto;

  @BuiltValueHook(initializeBuilder: true)
  static void _defaults(UpdateSavedDocumentViewRequestDtoBuilder b) => b;

  @BuiltValueSerializer(custom: true)
  static Serializer<UpdateSavedDocumentViewRequestDto> get serializer => _$UpdateSavedDocumentViewRequestDtoSerializer();
}

class _$UpdateSavedDocumentViewRequestDtoSerializer implements PrimitiveSerializer<UpdateSavedDocumentViewRequestDto> {
  @override
  final Iterable<Type> types = const [UpdateSavedDocumentViewRequestDto, _$UpdateSavedDocumentViewRequestDto];

  @override
  final String wireName = r'UpdateSavedDocumentViewRequestDto';

  Iterable<Object?> _serializeProperties(
    Serializers serializers,
    UpdateSavedDocumentViewRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) sync* {
    if (object.visibleColumns != null) {
      yield r'visibleColumns';
      yield serializers.serialize(
        object.visibleColumns,
        specifiedType: const FullType(BuiltList, [FullType(LibraryTableColumnId)]),
      );
    }
    if (object.name != null) {
      yield r'name';
      yield serializers.serialize(
        object.name,
        specifiedType: const FullType(String),
      );
    }
    if (object.visibility != null) {
      yield r'visibility';
      yield serializers.serialize(
        object.visibility,
        specifiedType: const FullType(UpdateSavedDocumentViewRequestDtoVisibilityEnum),
      );
    }
    if (object.searchQuery != null) {
      yield r'searchQuery';
      yield serializers.serialize(
        object.searchQuery,
        specifiedType: const FullType(String),
      );
    }
    if (object.sort != null) {
      yield r'sort';
      yield serializers.serialize(
        object.sort,
        specifiedType: const FullType(UpdateSavedDocumentViewRequestDtoSortEnum),
      );
    }
    if (object.order != null) {
      yield r'order';
      yield serializers.serialize(
        object.order,
        specifiedType: const FullType(UpdateSavedDocumentViewRequestDtoOrderEnum),
      );
    }
    if (object.viewMode != null) {
      yield r'viewMode';
      yield serializers.serialize(
        object.viewMode,
        specifiedType: const FullType(UpdateSavedDocumentViewRequestDtoViewModeEnum),
      );
    }
    if (object.filterMode != null) {
      yield r'filterMode';
      yield serializers.serialize(
        object.filterMode,
        specifiedType: const FullType(UpdateSavedDocumentViewRequestDtoFilterModeEnum),
      );
    }
    if (object.listScope != null) {
      yield r'listScope';
      yield serializers.serialize(
        object.listScope,
        specifiedType: const FullType(UpdateSavedDocumentViewRequestDtoListScopeEnum),
      );
    }
    if (object.folderId != null) {
      yield r'folderId';
      yield serializers.serialize(
        object.folderId,
        specifiedType: const FullType(String),
      );
    }
    if (object.mappeId != null) {
      yield r'mappeId';
      yield serializers.serialize(
        object.mappeId,
        specifiedType: const FullType(String),
      );
    }
    if (object.correspondentId != null) {
      yield r'correspondentId';
      yield serializers.serialize(
        object.correspondentId,
        specifiedType: const FullType(String),
      );
    }
    if (object.status != null) {
      yield r'status';
      yield serializers.serialize(
        object.status,
        specifiedType: const FullType(UpdateSavedDocumentViewRequestDtoStatusEnum),
      );
    }
    if (object.inbox != null) {
      yield r'inbox';
      yield serializers.serialize(
        object.inbox,
        specifiedType: const FullType(bool),
      );
    }
    if (object.withoutNonInboxLabel != null) {
      yield r'withoutNonInboxLabel';
      yield serializers.serialize(
        object.withoutNonInboxLabel,
        specifiedType: const FullType(bool),
      );
    }
    if (object.documentDateFrom != null) {
      yield r'documentDateFrom';
      yield serializers.serialize(
        object.documentDateFrom,
        specifiedType: const FullType(String),
      );
    }
    if (object.documentDateTo != null) {
      yield r'documentDateTo';
      yield serializers.serialize(
        object.documentDateTo,
        specifiedType: const FullType(String),
      );
    }
    if (object.tagIds != null) {
      yield r'tagIds';
      yield serializers.serialize(
        object.tagIds,
        specifiedType: const FullType(BuiltList, [FullType(String)]),
      );
    }
    if (object.pinnedSidebar != null) {
      yield r'pinnedSidebar';
      yield serializers.serialize(
        object.pinnedSidebar,
        specifiedType: const FullType(bool),
      );
    }
  }

  @override
  Object serialize(
    Serializers serializers,
    UpdateSavedDocumentViewRequestDto object, {
    FullType specifiedType = FullType.unspecified,
  }) {
    return _serializeProperties(serializers, object, specifiedType: specifiedType).toList();
  }

  void _deserializeProperties(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
    required List<Object?> serializedList,
    required UpdateSavedDocumentViewRequestDtoBuilder result,
    required List<Object?> unhandled,
  }) {
    for (var i = 0; i < serializedList.length; i += 2) {
      final key = serializedList[i] as String;
      final value = serializedList[i + 1];
      switch (key) {
        case r'visibleColumns':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(LibraryTableColumnId)]),
          ) as BuiltList<LibraryTableColumnId>;
          result.visibleColumns.replace(valueDes);
          break;
        case r'name':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.name = valueDes;
          break;
        case r'visibility':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UpdateSavedDocumentViewRequestDtoVisibilityEnum),
          ) as UpdateSavedDocumentViewRequestDtoVisibilityEnum;
          result.visibility = valueDes;
          break;
        case r'searchQuery':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.searchQuery = valueDes;
          break;
        case r'sort':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UpdateSavedDocumentViewRequestDtoSortEnum),
          ) as UpdateSavedDocumentViewRequestDtoSortEnum;
          result.sort = valueDes;
          break;
        case r'order':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UpdateSavedDocumentViewRequestDtoOrderEnum),
          ) as UpdateSavedDocumentViewRequestDtoOrderEnum;
          result.order = valueDes;
          break;
        case r'viewMode':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UpdateSavedDocumentViewRequestDtoViewModeEnum),
          ) as UpdateSavedDocumentViewRequestDtoViewModeEnum;
          result.viewMode = valueDes;
          break;
        case r'filterMode':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UpdateSavedDocumentViewRequestDtoFilterModeEnum),
          ) as UpdateSavedDocumentViewRequestDtoFilterModeEnum;
          result.filterMode = valueDes;
          break;
        case r'listScope':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UpdateSavedDocumentViewRequestDtoListScopeEnum),
          ) as UpdateSavedDocumentViewRequestDtoListScopeEnum;
          result.listScope = valueDes;
          break;
        case r'folderId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.folderId = valueDes;
          break;
        case r'mappeId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.mappeId = valueDes;
          break;
        case r'correspondentId':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.correspondentId = valueDes;
          break;
        case r'status':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(UpdateSavedDocumentViewRequestDtoStatusEnum),
          ) as UpdateSavedDocumentViewRequestDtoStatusEnum;
          result.status = valueDes;
          break;
        case r'inbox':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.inbox = valueDes;
          break;
        case r'withoutNonInboxLabel':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.withoutNonInboxLabel = valueDes;
          break;
        case r'documentDateFrom':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.documentDateFrom = valueDes;
          break;
        case r'documentDateTo':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(String),
          ) as String;
          result.documentDateTo = valueDes;
          break;
        case r'tagIds':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(BuiltList, [FullType(String)]),
          ) as BuiltList<String>;
          result.tagIds.replace(valueDes);
          break;
        case r'pinnedSidebar':
          final valueDes = serializers.deserialize(
            value,
            specifiedType: const FullType(bool),
          ) as bool;
          result.pinnedSidebar = valueDes;
          break;
        default:
          unhandled.add(key);
          unhandled.add(value);
          break;
      }
    }
  }

  @override
  UpdateSavedDocumentViewRequestDto deserialize(
    Serializers serializers,
    Object serialized, {
    FullType specifiedType = FullType.unspecified,
  }) {
    final result = UpdateSavedDocumentViewRequestDtoBuilder();
    final serializedList = (serialized as Iterable<Object?>).toList();
    final unhandled = <Object?>[];
    _deserializeProperties(
      serializers,
      serialized,
      specifiedType: specifiedType,
      serializedList: serializedList,
      unhandled: unhandled,
      result: result,
    );
    return result.build();
  }
}

class UpdateSavedDocumentViewRequestDtoVisibilityEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'private')
  static const UpdateSavedDocumentViewRequestDtoVisibilityEnum private = _$updateSavedDocumentViewRequestDtoVisibilityEnum_private;
  @BuiltValueEnumConst(wireName: r'shared')
  static const UpdateSavedDocumentViewRequestDtoVisibilityEnum shared = _$updateSavedDocumentViewRequestDtoVisibilityEnum_shared;

  static Serializer<UpdateSavedDocumentViewRequestDtoVisibilityEnum> get serializer => _$updateSavedDocumentViewRequestDtoVisibilityEnumSerializer;

  const UpdateSavedDocumentViewRequestDtoVisibilityEnum._(String name): super(name);

  static BuiltSet<UpdateSavedDocumentViewRequestDtoVisibilityEnum> get values => _$updateSavedDocumentViewRequestDtoVisibilityEnumValues;
  static UpdateSavedDocumentViewRequestDtoVisibilityEnum valueOf(String name) => _$updateSavedDocumentViewRequestDtoVisibilityEnumValueOf(name);
}

class UpdateSavedDocumentViewRequestDtoSortEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'updatedAt')
  static const UpdateSavedDocumentViewRequestDtoSortEnum updatedAt = _$updateSavedDocumentViewRequestDtoSortEnum_updatedAt;
  @BuiltValueEnumConst(wireName: r'createdAt')
  static const UpdateSavedDocumentViewRequestDtoSortEnum createdAt = _$updateSavedDocumentViewRequestDtoSortEnum_createdAt;
  @BuiltValueEnumConst(wireName: r'title')
  static const UpdateSavedDocumentViewRequestDtoSortEnum title = _$updateSavedDocumentViewRequestDtoSortEnum_title;
  @BuiltValueEnumConst(wireName: r'documentDate')
  static const UpdateSavedDocumentViewRequestDtoSortEnum documentDate = _$updateSavedDocumentViewRequestDtoSortEnum_documentDate;

  static Serializer<UpdateSavedDocumentViewRequestDtoSortEnum> get serializer => _$updateSavedDocumentViewRequestDtoSortEnumSerializer;

  const UpdateSavedDocumentViewRequestDtoSortEnum._(String name): super(name);

  static BuiltSet<UpdateSavedDocumentViewRequestDtoSortEnum> get values => _$updateSavedDocumentViewRequestDtoSortEnumValues;
  static UpdateSavedDocumentViewRequestDtoSortEnum valueOf(String name) => _$updateSavedDocumentViewRequestDtoSortEnumValueOf(name);
}

class UpdateSavedDocumentViewRequestDtoOrderEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'asc')
  static const UpdateSavedDocumentViewRequestDtoOrderEnum asc = _$updateSavedDocumentViewRequestDtoOrderEnum_asc;
  @BuiltValueEnumConst(wireName: r'desc')
  static const UpdateSavedDocumentViewRequestDtoOrderEnum desc = _$updateSavedDocumentViewRequestDtoOrderEnum_desc;

  static Serializer<UpdateSavedDocumentViewRequestDtoOrderEnum> get serializer => _$updateSavedDocumentViewRequestDtoOrderEnumSerializer;

  const UpdateSavedDocumentViewRequestDtoOrderEnum._(String name): super(name);

  static BuiltSet<UpdateSavedDocumentViewRequestDtoOrderEnum> get values => _$updateSavedDocumentViewRequestDtoOrderEnumValues;
  static UpdateSavedDocumentViewRequestDtoOrderEnum valueOf(String name) => _$updateSavedDocumentViewRequestDtoOrderEnumValueOf(name);
}

class UpdateSavedDocumentViewRequestDtoViewModeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'klassisch')
  static const UpdateSavedDocumentViewRequestDtoViewModeEnum klassisch = _$updateSavedDocumentViewRequestDtoViewModeEnum_klassisch;
  @BuiltValueEnumConst(wireName: r'karten')
  static const UpdateSavedDocumentViewRequestDtoViewModeEnum karten = _$updateSavedDocumentViewRequestDtoViewModeEnum_karten;
  @BuiltValueEnumConst(wireName: r'fokus')
  static const UpdateSavedDocumentViewRequestDtoViewModeEnum fokus = _$updateSavedDocumentViewRequestDtoViewModeEnum_fokus;

  static Serializer<UpdateSavedDocumentViewRequestDtoViewModeEnum> get serializer => _$updateSavedDocumentViewRequestDtoViewModeEnumSerializer;

  const UpdateSavedDocumentViewRequestDtoViewModeEnum._(String name): super(name);

  static BuiltSet<UpdateSavedDocumentViewRequestDtoViewModeEnum> get values => _$updateSavedDocumentViewRequestDtoViewModeEnumValues;
  static UpdateSavedDocumentViewRequestDtoViewModeEnum valueOf(String name) => _$updateSavedDocumentViewRequestDtoViewModeEnumValueOf(name);
}

class UpdateSavedDocumentViewRequestDtoFilterModeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'ui')
  static const UpdateSavedDocumentViewRequestDtoFilterModeEnum ui = _$updateSavedDocumentViewRequestDtoFilterModeEnum_ui;
  @BuiltValueEnumConst(wireName: r'query')
  static const UpdateSavedDocumentViewRequestDtoFilterModeEnum query = _$updateSavedDocumentViewRequestDtoFilterModeEnum_query;

  static Serializer<UpdateSavedDocumentViewRequestDtoFilterModeEnum> get serializer => _$updateSavedDocumentViewRequestDtoFilterModeEnumSerializer;

  const UpdateSavedDocumentViewRequestDtoFilterModeEnum._(String name): super(name);

  static BuiltSet<UpdateSavedDocumentViewRequestDtoFilterModeEnum> get values => _$updateSavedDocumentViewRequestDtoFilterModeEnumValues;
  static UpdateSavedDocumentViewRequestDtoFilterModeEnum valueOf(String name) => _$updateSavedDocumentViewRequestDtoFilterModeEnumValueOf(name);
}

class UpdateSavedDocumentViewRequestDtoListScopeEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'all')
  static const UpdateSavedDocumentViewRequestDtoListScopeEnum all = _$updateSavedDocumentViewRequestDtoListScopeEnum_all;
  @BuiltValueEnumConst(wireName: r'folder')
  static const UpdateSavedDocumentViewRequestDtoListScopeEnum folder = _$updateSavedDocumentViewRequestDtoListScopeEnum_folder;
  @BuiltValueEnumConst(wireName: r'mappe')
  static const UpdateSavedDocumentViewRequestDtoListScopeEnum mappe = _$updateSavedDocumentViewRequestDtoListScopeEnum_mappe;

  static Serializer<UpdateSavedDocumentViewRequestDtoListScopeEnum> get serializer => _$updateSavedDocumentViewRequestDtoListScopeEnumSerializer;

  const UpdateSavedDocumentViewRequestDtoListScopeEnum._(String name): super(name);

  static BuiltSet<UpdateSavedDocumentViewRequestDtoListScopeEnum> get values => _$updateSavedDocumentViewRequestDtoListScopeEnumValues;
  static UpdateSavedDocumentViewRequestDtoListScopeEnum valueOf(String name) => _$updateSavedDocumentViewRequestDtoListScopeEnumValueOf(name);
}

class UpdateSavedDocumentViewRequestDtoStatusEnum extends EnumClass {

  @BuiltValueEnumConst(wireName: r'uploaded')
  static const UpdateSavedDocumentViewRequestDtoStatusEnum uploaded = _$updateSavedDocumentViewRequestDtoStatusEnum_uploaded;
  @BuiltValueEnumConst(wireName: r'queued')
  static const UpdateSavedDocumentViewRequestDtoStatusEnum queued = _$updateSavedDocumentViewRequestDtoStatusEnum_queued;
  @BuiltValueEnumConst(wireName: r'extracting')
  static const UpdateSavedDocumentViewRequestDtoStatusEnum extracting = _$updateSavedDocumentViewRequestDtoStatusEnum_extracting;
  @BuiltValueEnumConst(wireName: r'ready')
  static const UpdateSavedDocumentViewRequestDtoStatusEnum ready = _$updateSavedDocumentViewRequestDtoStatusEnum_ready;
  @BuiltValueEnumConst(wireName: r'failed')
  static const UpdateSavedDocumentViewRequestDtoStatusEnum failed = _$updateSavedDocumentViewRequestDtoStatusEnum_failed;

  static Serializer<UpdateSavedDocumentViewRequestDtoStatusEnum> get serializer => _$updateSavedDocumentViewRequestDtoStatusEnumSerializer;

  const UpdateSavedDocumentViewRequestDtoStatusEnum._(String name): super(name);

  static BuiltSet<UpdateSavedDocumentViewRequestDtoStatusEnum> get values => _$updateSavedDocumentViewRequestDtoStatusEnumValues;
  static UpdateSavedDocumentViewRequestDtoStatusEnum valueOf(String name) => _$updateSavedDocumentViewRequestDtoStatusEnumValueOf(name);
}

